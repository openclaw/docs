---
read_when:
    - Depolanan oturumları listelemek ve son etkinliği görmek istiyorsunuz
summary: '`openclaw sessions` için CLI referansı (depolanmış oturumları listeleme + kullanım)'
title: Oturumlar
x-i18n:
    generated_at: "2026-05-05T08:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Saklanan konuşma oturumlarını listeleyin.

Oturum listeleri kanal/sağlayıcı canlılık kontrolleri değildir. Bunlar, oturum depolarından kalıcı hale getirilmiş konuşma satırlarını gösterir. Sessiz bir Discord, Slack, Telegram veya başka bir kanal, bir ileti işlenene kadar yeni bir oturum satırı oluşturmadan başarıyla yeniden bağlanabilir. Canlı kanal bağlantısına ihtiyaç duyduğunuzda `openclaw channels status --probe`, `openclaw status --deep` veya `openclaw health --verbose` kullanın.

`openclaw sessions` ve Gateway `sessions.list` yanıtları varsayılan olarak sınırlandırılır; böylece büyük ve uzun ömürlü depolar CLI sürecini veya Gateway olay döngüsünü tekeline alamaz. CLI varsayılan olarak en yeni 100 oturumu döndürür; daha küçük/daha büyük bir pencere için `--limit <n>`, bilerek tam depoya ihtiyaç duyduğunuzda ise `--limit all` geçirin. JSON yanıtları, çağıranların daha fazla satır bulunduğunu gösterebilmesi için `totalCount`, `limitApplied` ve `hasMore` içerir.

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

- varsayılan: yapılandırılmış varsayılan agent deposu
- `--verbose`: ayrıntılı günlükleme
- `--agent <id>`: yapılandırılmış tek bir agent deposu
- `--all-agents`: yapılandırılmış tüm agent depolarını birleştir
- `--store <path>`: açık depo yolu (`--agent` veya `--all-agents` ile birlikte kullanılamaz)
- `--limit <n|all>`: çıktıdaki en fazla satır sayısı (varsayılan `100`; `all` tam çıktıyı geri getirir)

Saklanan bir oturum için trajectory paketi dışa aktarın:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Bu, sahip exec isteğini onayladıktan sonra `/export-trajectory` slash komutu tarafından kullanılan komut yoludur. Çıktı dizini her zaman seçili workspace altında `.openclaw/trajectory-exports/` içinde çözümlenir.

`openclaw sessions --all-agents`, yapılandırılmış agent depolarını okur. Gateway ve ACP oturum keşfi daha geniştir: varsayılan `agents/` kökü veya şablonlanmış bir `session.store` kökü altında bulunan yalnızca diskteki depoları da içerirler. Keşfedilen bu depolar, agent kökü içinde normal `sessions.json` dosyalarına çözümlenmelidir; symlink'ler ve kök dışı yollar atlanır.

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`, yapılandırmadaki `session.maintenance` ayarlarını kullanır:

- Kapsam notu: `openclaw sessions cleanup` oturum depolarının, transkriptlerin ve trajectory sidecar'larının bakımını yapar. [Cron yapılandırması](/tr/automation/cron-jobs#configuration) içinde `cron.runLog.maxBytes` ve `cron.runLog.keepLines` tarafından yönetilen ve [Cron bakımı](/tr/automation/cron-jobs#maintenance) içinde açıklanan Cron çalıştırma günlüklerini (`cron/runs/<jobId>.jsonl`) budamaz.
- Temizlik ayrıca referans verilmeyen birincil transkriptleri, Compaction checkpoint'lerini ve `session.maintenance.pruneAfter` değerinden eski trajectory sidecar'larını budar; `sessions.json` tarafından hâlâ referans verilen dosyalar korunur.

- `--dry-run`: yazmadan kaç girdinin budanacağını/sınırlandırılacağını önizleyin.
  - Metin modunda dry-run, neyin tutulup neyin kaldırılacağını görebilmeniz için oturum başına bir eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır.
- `--enforce`: `session.maintenance.mode` `warn` olsa bile bakımı uygula.
- `--fix-missing`: transkript dosyaları eksik olan girdileri, normalde henüz yaş/sayı sınırına takılmayacak olsalar bile kaldır.
- `--active-key <key>`: belirli bir etkin anahtarı disk bütçesi nedeniyle çıkarılmaya karşı koru. Grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi dayanıklı harici konuşma işaretçileri de yaş/sayı/disk bütçesi bakımı tarafından tutulur.
- `--agent <id>`: yapılandırılmış tek bir agent deposu için temizlik çalıştır.
- `--all-agents`: yapılandırılmış tüm agent depoları için temizlik çalıştır.
- `--store <path>`: belirli bir `sessions.json` dosyasına karşı çalıştır.
- `--json`: JSON özeti yazdır. `--all-agents` ile çıktı, depo başına bir özet içerir.

Bir Gateway erişilebilir olduğunda, yapılandırılmış agent depoları için dry-run olmayan temizlik Gateway üzerinden gönderilir; böylece runtime trafiğiyle aynı oturum deposu yazıcısını paylaşır. Bir depo dosyasının açık çevrimdışı onarımı için `--store <path>` kullanın.

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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

İlgili:

- Oturum yapılandırması: [Yapılandırma referansı](/tr/gateway/config-agents#session)

## İlgili

- [CLI referansı](/tr/cli)
- [Oturum yönetimi](/tr/concepts/session)
