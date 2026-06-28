---
read_when:
    - Claude Code / Codex / Gemini CLI için acpx koşumunu yükleme veya yapılandırma
    - plugin-tools veya OpenClaw-tools MCP köprüsünü etkinleştirme
    - ACP izin modlarını yapılandırma
summary: 'ACP ajanlarını ayarlama: acpx harness yapılandırması, plugin kurulumu, izinler'
title: ACP aracıları — kurulum
x-i18n:
    generated_at: "2026-06-28T01:20:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Genel bakış, operatör runbook'u ve kavramlar için bkz. [ACP aracıları](/tr/tools/acp-agents).

Aşağıdaki bölümler acpx harness yapılandırmasını, MCP köprüleri için Plugin kurulumunu ve izin yapılandırmasını kapsar.

Bu sayfayı yalnızca ACP/acpx rotasını ayarlarken kullanın. Yerel Codex
app-server çalışma zamanı yapılandırması için [Codex harness](/tr/plugins/codex-harness) sayfasını kullanın. OpenAI API anahtarları veya Codex OAuth model sağlayıcısı yapılandırması için
[OpenAI](/tr/providers/openai) sayfasını kullanın.

Codex'in iki OpenClaw rotası vardır:

| Rota                       | Yapılandırma/komut                                    | Kurulum sayfası                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Yerel Codex app-server     | `/codex ...`, `openai/gpt-*` aracı başvuruları         | [Codex harness](/tr/plugins/codex-harness) |
| Açık Codex ACP adaptörü    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Bu sayfa                                |

ACP/acpx davranışına açıkça ihtiyacınız yoksa yerel rotayı tercih edin.

## acpx harness desteği (güncel)

Güncel acpx yerleşik harness takma adları:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

OpenClaw acpx arka ucunu kullandığında, acpx yapılandırmanız özel aracı takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak sunuyorsa, yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızda `cursor` aracı komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı, `--agent <command>` ile rastgele adaptörleri de hedefleyebilir; ancak bu ham kaçış yolu bir acpx CLI özelliğidir (normal OpenClaw `agentId` yolu değildir).

Model denetimi adaptör yeteneğine bağlıdır. Codex ACP model başvuruları başlatmadan önce OpenClaw tarafından normalleştirilir. Diğer harness'ler ACP `models` ve `session/set_model` desteğine ihtiyaç duyar; bir harness ne bu ACP yeteneğini ne de kendi başlangıç model bayrağını sunuyorsa, OpenClaw/acpx model seçimini zorlayamaz.

## Gerekli yapılandırma

Çekirdek ACP temeli:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "openclaw",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

İş parçacığı bağlama yapılandırması kanal adaptörüne özeldir. Discord için örnek:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

İş parçacığına bağlı ACP spawn çalışmıyorsa, önce adaptör özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Geçerli konuşma bağlamaları alt iş parçacığı oluşturmayı gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlamalarını sunan bir kanal adaptörü gerektirir.

Bkz. [Yapılandırma Başvurusu](/tr/gateway/configuration-reference).

## acpx arka ucu için Plugin kurulumu

Paketlenmiş kurulumlar ACP için resmi `@openclaw/acpx` çalışma zamanı Plugin'ini kullanır.
ACP harness oturumlarını kullanmadan önce bunu kurun ve etkinleştirin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak checkout'ları `pnpm install` sonrasında yerel çalışma alanı Plugin'ini de kullanabilir.

Şununla başlayın:

```text
/acp doctor
```

`acpx` öğesini devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` ile reddettiyseniz veya paketlenmiş Plugin'e geri dönmek istiyorsanız, açık paket yolunu kullanın:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Geliştirme sırasında yerel çalışma alanı kurulumu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Ardından arka uç sağlığını doğrulayın:

```text
/acp doctor
```

### acpx komutu ve sürüm yapılandırması

Varsayılan olarak `acpx` Plugin'i, Gateway başlatılırken gömülü ACP arka ucunu kaydeder ve Gateway `ready` sinyalinden önce gömülü çalışma zamanı başlangıç yoklamasını bekler. `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` veya `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` değerlerini yalnızca başlangıç yoklamasını kasıtlı olarak devre dışı tutan betikler veya ortamlar için ayarlayın. Açık, isteğe bağlı bir yoklama için `/acp doctor` çalıştırın.

Plugin yapılandırmasında komutu veya sürümü geçersiz kılın:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` mutlak yol, göreli yol (OpenClaw çalışma alanından çözümlenir) veya komut adı kabul eder.
- `expectedVersion: "any"` katı sürüm eşleştirmesini devre dışı bırakır.
- Özel `command` yolları Plugin yerel otomatik kurulumu devre dışı bırakır.

Bir yol veya bayrak değeri tek bir argv belirteci olarak kalmalıysa, bağımsız bir ACP aracı komutunu yapılandırılmış argümanlarla geçersiz kılın:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command`, o ACP aracı için çalıştırılabilir dosya veya mevcut komut dizesidir.
- `agents.<id>.args` isteğe bağlıdır. OpenClaw bunları geçerli acpx komut dizesi kayıt defterinden geçirmeden önce her dizi öğesi shell için tırnaklanır.

Bkz. [Plugin'ler](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'ı `npm install -g openclaw` ile global olarak kurduğunuzda, acpx çalışma zamanı bağımlılıkları (platforma özgü ikililer) bir postinstall hook'u aracılığıyla otomatik olarak kurulur. Otomatik kurulum başarısız olursa Gateway yine normal şekilde başlar ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, OpenClaw Plugin kayıtlı araçları ACP harness'e sunmaz.

Codex veya Claude Code gibi ACP aracılarının memory recall/store gibi kurulu OpenClaw Plugin araçlarını çağırmasını istiyorsanız, ayrılmış köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum bootstrap'ine `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu enjekte eder.
- Kurulu ve etkin OpenClaw Plugin'leri tarafından zaten kaydedilmiş Plugin araçlarını sunar.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP aracıları yalnızca Gateway'de zaten etkin olan Plugin araçlarına erişim elde eder.
- Bunu, söz konusu Plugin'lerin OpenClaw içinde yürütülmesine izin vermekle aynı güven sınırı olarak ele alın.
- Etkinleştirmeden önce kurulu Plugin'leri gözden geçirin.

Özel `mcpServers` önceki gibi çalışmaya devam eder. Yerleşik Plugin araçları köprüsü, genel MCP sunucusu yapılandırmasının yerine geçmez; ek bir isteğe bağlı kolaylıktır.

### OpenClaw araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, yerleşik OpenClaw araçlarını da MCP üzerinden sunmaz. Bir ACP aracısının `cron` gibi seçili yerleşik araçlara ihtiyacı olduğunda ayrı çekirdek araçlar köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum bootstrap'ine `openclaw-tools` adlı yerleşik bir MCP sunucusu enjekte eder.
- Seçili yerleşik OpenClaw araçlarını sunar. İlk sunucu `cron` sunar.
- Çekirdek araç sunumunu açık ve varsayılan olarak kapalı tutar.

### Çalışma zamanı işlem zaman aşımı yapılandırması

`acpx` Plugin'i, gömülü çalışma zamanı başlangıç ve denetim işlemlerine varsayılan olarak 120 saniye verir. Bu, Gemini CLI gibi daha yavaş harness'lere ACP başlatma ve ilklendirmeyi tamamlamak için yeterli süre sağlar. Ana makineniz farklı bir işlem sınırına ihtiyaç duyuyorsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Çalışma zamanı turları, `/acp timeout` dahil OpenClaw aracı/çalıştırma zaman aşımlarını kullanır. `sessions_spawn` çağrı başına zaman aşımı geçersiz kılmalarını kabul etmez. Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

### Sağlık yoklaması aracı yapılandırması

`/acp doctor` veya başlangıç yoklaması arka ucu denetlediğinde, paketli `acpx` Plugin'i bir harness aracısını yoklar. `acp.allowedAgents` ayarlanmışsa varsayılan olarak ilk izin verilen aracı kullanır; aksi halde varsayılan olarak `codex` kullanır. Dağıtımınız sağlık kontrolleri için farklı bir ACP aracısına ihtiyaç duyuyorsa, yoklama aracısını açıkça ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır: dosya yazma ve shell yürütme izin istemlerini onaylamak veya reddetmek için TTY yoktur. acpx Plugin'i izinlerin nasıl işleneceğini denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri, OpenClaw exec onaylarından ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka uç sağlayıcı atlama bayraklarından ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyindeki break-glass anahtarıdır.

OpenClaw `tools.exec.mode`, Codex Guardian onayları ve ACPX harness izinleri arasındaki daha geniş karşılaştırma için bkz. [İzin modları](/tr/tools/permission-modes).

### `permissionMode`

Harness aracısının istem göstermeden hangi işlemleri gerçekleştirebileceğini denetler.

| Değer           | Davranış                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tüm dosya yazmalarını ve shell komutlarını otomatik onaylar. |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazmalar ve exec istem gerektirir. |
| `deny-all`      | Tüm izin istemlerini reddeder.                            |

### `nonInteractivePermissions`

Bir izin istemi gösterilecek olduğunda ancak etkileşimli TTY kullanılamadığında ne olacağını denetler (ACP oturumları için durum her zaman budur).

| Değer  | Davranış                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile iptal eder. **(varsayılan)**        |
| `deny` | İzni sessizce reddeder ve devam eder (kademeli bozulma).          |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra Gateway'i yeniden başlatın.

<Warning>
OpenClaw varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemini tetikleyen herhangi bir yazma veya exec, `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` ile başarısız olabilir.

İzinleri kısıtlamanız gerekiyorsa, oturumların çökmesi yerine kademeli olarak bozulması için `nonInteractivePermissions` değerini `deny` olarak ayarlayın.
</Warning>

## İlgili

- [ACP aracıları](/tr/tools/acp-agents) — genel bakış, operatör runbook'u, kavramlar
- [Alt aracılar](/tr/tools/subagents)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
