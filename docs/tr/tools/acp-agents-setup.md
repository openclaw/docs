---
read_when:
    - Claude Code / Codex / Gemini CLI için acpx düzeneğini yükleme veya yapılandırma
    - plugin-tools veya OpenClaw-tools MCP köprüsünü etkinleştirme
    - ACP izin modlarını yapılandırma
summary: 'ACP ajanlarını ayarlama: acpx harness yapılandırması, Plugin kurulumu, izinler'
title: ACP ajanları — kurulum
x-i18n:
    generated_at: "2026-05-02T09:07:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Genel bakış, operatör çalışma kitabı ve kavramlar için bkz. [ACP aracıları](/tr/tools/acp-agents).

Aşağıdaki bölümler acpx harness yapılandırmasını, MCP köprüleri için Plugin kurulumunu ve izin yapılandırmasını kapsar.

Bu sayfayı yalnızca ACP/acpx rotasını kurarken kullanın. Yerel Codex
app-server çalışma zamanı yapılandırması için [Codex harness](/tr/plugins/codex-harness) sayfasını kullanın. 
OpenAI API anahtarları veya Codex OAuth model sağlayıcı yapılandırması için
[OpenAI](/tr/providers/openai) sayfasını kullanın.

Codex'in iki OpenClaw rotası vardır:

| Rota                       | Yapılandırma/komut                                     | Kurulum sayfası                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Yerel Codex app-server     | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/tr/plugins/codex-harness) |
| Açık Codex ACP adaptörü    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Bu sayfa                                |

Özellikle ACP/acpx davranışına ihtiyacınız yoksa yerel rotayı tercih edin.

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
- `pi`
- `qwen`

OpenClaw acpx arka ucunu kullandığında, acpx yapılandırmanız özel aracı takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak sunuyorsa, yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızda `cursor` aracı komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı `--agent <command>` ile keyfi adaptörleri de hedefleyebilir, ancak bu ham kaçış yolu bir acpx CLI özelliğidir (normal OpenClaw `agentId` yolu değildir).

Model denetimi adaptör yeteneğine bağlıdır. Codex ACP model referansları
başlatmadan önce OpenClaw tarafından normalleştirilir. Diğer harness'ler ACP `models` ve
`session/set_model` desteğine ihtiyaç duyar; bir harness ne bu ACP yeteneğini
ne de kendi başlangıç model bayrağını sunuyorsa, OpenClaw/acpx bir model seçimini zorlayamaz.

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
      "pi",
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

İş parçacığına bağlı ACP spawn çalışmıyorsa önce adaptör özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Geçerli konuşma bağlamaları alt iş parçacığı oluşturulmasını gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlamalarını sunan bir kanal adaptörü gerektirir.

Bkz. [Yapılandırma Referansı](/tr/gateway/configuration-reference).

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

`acpx` öğesini devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` ile reddettiyseniz veya
paketlenmiş Plugin'e geri dönmek istiyorsanız açık paket yolunu kullanın:

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

Varsayılan olarak `acpx` Plugin'i, Gateway başlangıcı sırasında
bir ACP aracısı başlatmadan gömülü ACP arka ucunu kaydeder. Açık
canlı yoklama için `/acp doctor` çalıştırın. `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` değerini yalnızca
Gateway'in başlangıçta yapılandırılmış aracıyı yoklamasına ihtiyacınız olduğunda ayarlayın.

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
- `expectedVersion: "any"` katı sürüm eşleştirmeyi devre dışı bırakır.
- Özel `command` yolları Plugin yerel otomatik kurulumu devre dışı bırakır.

Bkz. [Plugins](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'ı `npm install -g openclaw` ile global olarak kurduğunuzda, acpx
çalışma zamanı bağımlılıkları (platforma özgü ikili dosyalar) bir postinstall kancası
aracılığıyla otomatik olarak kurulur. Otomatik kurulum başarısız olursa Gateway yine
normal şekilde başlar ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, OpenClaw Plugin kayıtlı araçlarını
ACP harness'e sunmaz.

Codex veya Claude Code gibi ACP aracılarının bellek geri çağırma/depolama gibi kurulu
OpenClaw Plugin araçlarını çağırmasını istiyorsanız özel köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturumu bootstrap işlemine `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu
  enjekte eder.
- Kurulu ve etkinleştirilmiş OpenClaw Plugin'leri tarafından zaten kaydedilmiş Plugin araçlarını sunar.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP aracıları yalnızca Gateway'de zaten etkin olan Plugin araçlarına erişebilir.
- Bunu, söz konusu Plugin'lerin OpenClaw içinde çalıştırılmasına izin vermekle aynı güven sınırı olarak ele alın.
- Etkinleştirmeden önce kurulu Plugin'leri gözden geçirin.

Özel `mcpServers` eskisi gibi çalışmaya devam eder. Yerleşik Plugin araçları köprüsü,
genel MCP sunucu yapılandırmasının yerine geçen bir seçenek değil, ek bir isteğe bağlı kolaylıktır.

### OpenClaw araçları MCP köprüsü

Varsayılan olarak ACPX oturumları yerleşik OpenClaw araçlarını da MCP üzerinden
sunmaz. Bir ACP aracısının `cron` gibi seçili yerleşik araçlara ihtiyacı olduğunda
ayrı çekirdek araçları köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturumu bootstrap işlemine `openclaw-tools` adlı yerleşik bir MCP sunucusu
  enjekte eder.
- Seçili yerleşik OpenClaw araçlarını sunar. İlk sunucu `cron` sunar.
- Çekirdek araç sunumunu açık ve varsayılan olarak kapalı tutar.

### Çalışma zamanı zaman aşımı yapılandırması

`acpx` Plugin'i gömülü çalışma zamanı dönüşleri için varsayılan olarak 120 saniyelik
zaman aşımı kullanır. Bu, Gemini CLI gibi daha yavaş harness'lere ACP başlatma
ve ilklendirmeyi tamamlamak için yeterli süre verir. Ana makineniz farklı bir
çalışma zamanı sınırına ihtiyaç duyuyorsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

### Sağlık yoklama aracısı yapılandırması

`/acp doctor` veya isteğe bağlı başlangıç yoklaması arka ucu denetlediğinde, paketlenmiş
`acpx` Plugin'i bir harness aracısını yoklar. `acp.allowedAgents` ayarlanmışsa
varsayılan olarak ilk izin verilen aracı kullanılır; aksi halde varsayılan `codex` olur. Dağıtımınız
sağlık denetimleri için farklı bir ACP aracısına ihtiyaç duyuyorsa yoklama aracısını
açıkça ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır; dosya yazma ve shell-exec izin istemlerini onaylamak veya reddetmek için TTY yoktur. acpx Plugin'i izinlerin nasıl ele alınacağını denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri, OpenClaw exec onaylarından ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka uç satıcı baypas bayraklarından ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyinde acil durum anahtarıdır.

### `permissionMode`

Harness aracısının istem göstermeden hangi işlemleri gerçekleştirebileceğini denetler.

| Değer           | Davranış                                                 |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Tüm dosya yazmalarını ve shell komutlarını otomatik onaylar. |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazmalar ve exec istem gerektirir. |
| `deny-all`      | Tüm izin istemlerini reddeder.                           |

### `nonInteractivePermissions`

Bir izin istemi gösterilecekse ancak etkileşimli TTY kullanılamıyorsa ne olacağını denetler (ACP oturumları için her zaman böyledir).

| Değer  | Davranış                                                         |
| ------ | ---------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile durdurur. **(varsayılan)**         |
| `deny` | İzni sessizce reddeder ve devam eder (zarif gerileme).           |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra Gateway'i yeniden başlatın.

<Warning>
OpenClaw varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemini tetikleyen herhangi bir yazma veya exec işlemi `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` ile başarısız olabilir.

İzinleri kısıtlamanız gerekiyorsa, oturumların çökmek yerine zarif biçimde gerilemesi için `nonInteractivePermissions` değerini `deny` olarak ayarlayın.
</Warning>

## İlgili

- [ACP aracıları](/tr/tools/acp-agents) — genel bakış, operatör çalışma kitabı, kavramlar
- [Alt aracılar](/tr/tools/subagents)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
