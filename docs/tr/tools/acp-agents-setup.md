---
read_when:
    - Claude Code / Codex / Gemini CLI için `acpx` harness’ını yükleme veya yapılandırma
    - '`plugin-tools` veya OpenClaw-tools MCP köprüsünü etkinleştirme'
    - ACP izin modlarını yapılandırma
summary: 'ACP aracılarının kurulumu: `acpx` harness yapılandırması, Plugin kurulumu, izinler'
title: ACP ajanları — kurulum
x-i18n:
    generated_at: "2026-04-24T09:32:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Genel bakış, operatör runbook’u ve kavramlar için bkz. [ACP ajanları](/tr/tools/acp-agents).
Bu sayfa `acpx` harness yapılandırmasını, MCP köprüleri için Plugin kurulumunu ve
izin yapılandırmasını kapsar.

## `acpx` harness desteği (güncel)

Güncel `acpx` yerleşik harness takma adları:

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

OpenClaw `acpx` arka ucunu kullandığında, `acpx` yapılandırmanız özel ajan takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP’yi hâlâ `agent acp` olarak sunuyorsa, yerleşik varsayılanı değiştirmek yerine `acpx` yapılandırmanızda `cursor` ajan komutunu geçersiz kılın.

Doğrudan `acpx` CLI kullanımı ayrıca `--agent <command>` aracılığıyla rastgele bağdaştırıcıları hedefleyebilir, ancak bu ham kaçış kapağı bir `acpx` CLI özelliğidir (normal OpenClaw `agentId` yolu değildir).

## Gerekli yapılandırma

Temel ACP tabanı:

```json5
{
  acp: {
    enabled: true,
    // İsteğe bağlı. Varsayılan değer true'dur; /acp denetimlerini korurken ACP gönderimini duraklatmak için false olarak ayarlayın.
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

İş parçacığı bağlama yapılandırması, kanal bağdaştırıcısına özeldir. Discord için örnek:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

İş parçacığına bağlı ACP oluşturma çalışmıyorsa önce bağdaştırıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Geçerli konuşma bağları alt iş parçacığı oluşturmayı gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlarını sunan bir kanal bağdaştırıcısı gerektirirler.

Bkz. [Yapılandırma Referansı](/tr/gateway/configuration-reference).

## `acpx` arka ucu için Plugin kurulumu

Yeni kurulumlarda paketle gelen `acpx` çalışma zamanı Plugin’i varsayılan olarak etkindir, bu yüzden ACP
genellikle elle Plugin kurulum adımı olmadan çalışır.

Şununla başlayın:

```text
/acp doctor
```

`acpx`’i devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` ile reddettiyseniz veya
yerel bir geliştirme checkout’una geçmek istiyorsanız, açık Plugin yolunu kullanın:

```bash
openclaw plugins install acpx
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

### `acpx` komut ve sürüm yapılandırması

Varsayılan olarak, paketle gelen `acpx` Plugin’i kendi Plugin’e yerel sabitlenmiş ikilisini kullanır (Plugin paketi içindeki `node_modules/.bin/acpx`). Başlangıç, arka ucu hazır değil olarak kaydeder ve bir arka plan işi `acpx --version` komutunu doğrular; ikili eksikse veya eşleşmiyorsa `npm install --omit=dev --no-save acpx@<pinned>` çalıştırır ve yeniden doğrular. Gateway tüm süreç boyunca engelleyici olmayan durumda kalır.

Komutu veya sürümü Plugin yapılandırmasında geçersiz kılın:

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
- Özel `command` yolları Plugin’e yerel otomatik kurulumu devre dışı bırakır.

Bkz. [Plugins](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw’ı `npm install -g openclaw` ile global olarak kurduğunuzda, `acpx`
çalışma zamanı bağımlılıkları (platforma özgü ikililer) bir postinstall kancası
aracılığıyla otomatik olarak kurulur. Otomatik kurulum başarısız olursa Gateway yine de
normal şekilde başlar ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak, ACPX oturumları OpenClaw Plugin’e kayıtlı araçları
ACP harness’a açığa çıkarmaz.

Codex veya Claude Code gibi ACP ajanlarının yüklü
OpenClaw Plugin araçlarını, örneğin bellek geri çağırma/depolamayı, çağırmasını istiyorsanız özel köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum önyüklemesine `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu
  ekler.
- Yüklü ve etkin OpenClaw
  Plugin’leri tarafından zaten kaydedilmiş Plugin araçlarını açığa çıkarır.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP ajanları yalnızca Gateway’de zaten etkin olan Plugin araçlarına erişim elde eder.
- Bunu, bu Plugin’lerin OpenClaw içinde
  çalışmasına izin vermekle aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce yüklü Plugin’leri gözden geçirin.

Özel `mcpServers` eskisi gibi çalışmaya devam eder. Yerleşik `plugin-tools` köprüsü,
genel MCP sunucu yapılandırmasının yerine geçen bir çözüm değil, ek bir isteğe bağlı kullanım kolaylığıdır.

### OpenClaw araçları MCP köprüsü

Varsayılan olarak, ACPX oturumları ayrıca yerleşik OpenClaw araçlarını da
MCP üzerinden açığa çıkarmaz. Bir ACP ajanı `cron` gibi seçili
yerleşik araçlara ihtiyaç duyduğunda ayrı çekirdek araçları köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum önyüklemesine `openclaw-tools` adlı yerleşik bir MCP sunucusu
  ekler.
- Seçilmiş yerleşik OpenClaw araçlarını açığa çıkarır. İlk sunucu `cron` aracını açığa çıkarır.
- Çekirdek araçlarının açığa çıkarılmasını açık ve varsayılan olarak kapalı tutar.

### Çalışma zamanı zaman aşımı yapılandırması

Paketle gelen `acpx` Plugin’i, gömülü çalışma zamanı turlarını varsayılan olarak 120 saniyelik
bir zaman aşımına ayarlar. Bu, Gemini CLI gibi daha yavaş harness’lara
ACP başlangıcını ve ilklendirmeyi tamamlaması için yeterli zaman verir. Ana makineniz farklı
bir çalışma zamanı sınırına ihtiyaç duyuyorsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Bu değeri değiştirdikten sonra Gateway’i yeniden başlatın.

### Sağlık probu ajan yapılandırması

Paketle gelen `acpx` Plugin’i, gömülü çalışma zamanı arka ucunun hazır olup olmadığına
karar verirken bir harness ajanını probdan geçirir. Varsayılan olarak `codex` kullanır. Kurulumunuz
farklı bir varsayılan ACP ajanı kullanıyorsa, prob ajanını aynı kimliğe ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra Gateway’i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve kabuk çalıştırma izin istemlerini onaylamak veya reddetmek için TTY yoktur. `acpx` Plugin’i, izinlerin nasıl ele alındığını denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri, OpenClaw çalıştırma onaylarından ayrıdır ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka ucu sağlayıcı atlama bayraklarından da ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyinde acil durum anahtarıdır.

### `permissionMode`

Harness ajanının istem göstermeden hangi işlemleri gerçekleştirebileceğini denetler.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tüm dosya yazmalarını ve kabuk komutlarını otomatik onaylar. |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazmalar ve çalıştırmalar istem gerektirir. |
| `deny-all`      | Tüm izin istemlerini reddeder.                              |

### `nonInteractivePermissions`

Bir izin istemi gösterilecek olduğunda ancak etkileşimli bir TTY mevcut olmadığında ne olacağını denetler (ACP oturumlarında durum her zaman budur).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile sonlandırır. **(varsayılan)**           |
| `deny` | İzni sessizce reddeder ve devam eder (zarif bozulma). |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra Gateway’i yeniden başlatın.

> **Önemli:** OpenClaw şu anda varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemi tetikleyen herhangi bir yazma veya çalıştırma işlemi `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` ile başarısız olabilir.
>
> İzinleri kısıtlamanız gerekiyorsa, oturumlar çökme yerine zarif biçimde bozulsun diye `nonInteractivePermissions` değerini `deny` olarak ayarlayın.

## İlgili

- [ACP ajanları](/tr/tools/acp-agents) — genel bakış, operatör runbook’u, kavramlar
- [Alt ajanlar](/tr/tools/subagents)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
