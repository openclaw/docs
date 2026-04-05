---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir geri dönüş istediğinizde
    - Claude CLI veya diğer yerel AI CLI'lerini çalıştırıyor ve bunları yeniden kullanmak istiyorsanız
    - CLI arka ucu araç erişimi için MCP loopback köprüsünü anlamak istiyorsanız
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüne sahip yerel AI CLI geri dönüşü'
title: CLI Arka Uçları
x-i18n:
    generated_at: "2026-04-05T13:52:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI arka uçları (geri dönüş çalışma zamanı)

OpenClaw, API sağlayıcıları devre dışı kaldığında,
oran sınırına takıldığında veya geçici olarak hatalı davrandığında
**metin tabanlı bir geri dönüş** olarak **yerel AI CLI'lerini** çalıştırabilir. Bu yaklaşım kasıtlı olarak muhafazakardır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan
  arka uçlar (varsayılan Claude CLI davranışı) gateway araçlarını bir loopback MCP köprüsü aracılığıyla alabilir.
- **JSONL akışı** (Claude CLI, `--output-format stream-json` komutunu
  `--include-partial-messages` ile kullanır; istemler stdin üzerinden gönderilir).
- **Oturumlar desteklenir** (böylece takip eden turlar tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler iletilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere bağlı kalmadan
“her zaman çalışan” metin yanıtları istediğinizde kullanın.

ACP oturum denetimlerine, arka plan görevlerine,
iş parçacığı/konuşma bağlamasına ve kalıcı harici kodlama oturumlarına sahip tam bir harness çalışma zamanı istiyorsanız,
bunun yerine [ACP Agents](/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Yeni başlayanlar için hızlı başlangıç

Claude CLI'yi **hiçbir config olmadan** kullanabilirsiniz (paketlenmiş Anthropic eklentisi
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Codex CLI de kutudan çıktığı gibi çalışır (paketlenmiş OpenAI eklentisi üzerinden):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gateway'iniz launchd/systemd altında çalışıyor ve PATH sınırlıysa yalnızca
komut yolunu ekleyin:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Hepsi bu. Anahtar gerekmez, CLI'nin kendisinin ötesinde ek auth config'i gerekmez.

Paketlenmiş bir CLI arka ucunu bir
gateway ana makinesinde **birincil mesaj sağlayıcısı** olarak kullanırsanız, OpenClaw artık config'iniz
bir model referansında veya
`agents.defaults.cliBackends` altında bu arka uca açıkça başvurduğunda sahip olan paketlenmiş eklentiyi otomatik yükler.

## Bunu geri dönüş olarak kullanma

Bir CLI arka ucunu geri dönüş listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

Notlar:

- `agents.defaults.models` (izin listesi) kullanıyorsanız `claude-cli/...` değerini de eklemelisiniz.
- Birincil sağlayıcı başarısız olursa (auth, oran sınırları, zaman aşımı), OpenClaw
  sıradaki olarak CLI arka ucunu dener.
- Paketlenmiş Claude CLI arka ucu hâlâ
  `claude-cli/opus`, `claude-cli/opus-4.6` veya `claude-cli/sonnet` gibi daha kısa takma adları kabul eder, ancak belgeler
  ve config örnekleri kanonik `claude-cli/claude-*` referanslarını kullanır.

## Config genel bakışı

Tüm CLI arka uçları şu yolun altında bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **sağlayıcı kimliği** ile anahtarlanır (ör. `claude-cli`, `my-cli`).
Sağlayıcı kimliği model referansınızın sol tarafı olur:

```
<provider>/<model>
```

### Örnek config

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Nasıl çalışır

1. **Sağlayıcı önekine** göre bir arka uç seçer (`claude-cli/...`).
2. Aynı OpenClaw istemi + çalışma alanı bağlamını kullanarak **bir sistem istemi oluşturur**.
3. Geçmişin tutarlı kalması için CLI'yi bir oturum kimliğiyle (destekleniyorsa) **çalıştırır**.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. **Oturum kimliklerini** arka uç başına kalıcı hale getirir, böylece takip eden işlemler aynı CLI oturumunu yeniden kullanır.

## Oturumlar

- CLI oturumları destekliyorsa `sessionArg` (ör. `--session-id`) veya
  kimliğin birden fazla bayrağa eklenmesi gerektiğinde `sessionArgs` (`{sessionId}` yer tutucusu) ayarlayın.
- CLI, farklı bayraklarla bir **resume alt komutu** kullanıyorsa
  `resumeArgs` ayarlayın (yeniden başlatırken `args` yerine geçer) ve isteğe bağlı olarak
  `resumeOutput` ayarlayın (JSON olmayan yeniden başlatmalar için).
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklı değilse yeni UUID).
  - `existing`: yalnızca daha önce bir oturum kimliği saklandıysa gönderir.
  - `none`: asla oturum kimliği göndermez.

Serileştirme notları:

- `serialize: true`, aynı şerit üzerindeki çalıştırmaları sıralı tutar.
- Çoğu CLI, tek bir sağlayıcı şeridinde serileştirir.
- `claude-cli` daha dardır: yeniden başlatılan çalıştırmalar Claude oturum kimliği başına, yeni çalıştırmalar ise çalışma alanı yolu başına serileştirilir. Bağımsız çalışma alanları paralel çalışabilir.
- OpenClaw, arka uç auth durumu değiştiğinde saklanan CLI oturumu yeniden kullanımını bırakır; buna yeniden oturum açma, token döndürme veya değişen bir auth profili kimlik bilgisi dahildir.

## Görüntüler (iletme)

CLI'niz görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw, base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlıysa bu
yollar CLI bağımsız değişkenleri olarak geçirilir. `imageArg` eksikse OpenClaw
dosya yollarını isteme ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları otomatik yükleyen
CLI'ler için yeterlidir (Claude CLI davranışı).

## Girdiler / çıktılar

- `output: "json"` (varsayılan), JSON'u ayrıştırmayı ve metin + oturum kimliği çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda
  yanıt metnini `response` içinden ve kullanımı `stats` içinden okur.
- `output: "jsonl"`, JSONL akışlarını ayrıştırır (örneğin Claude CLI `stream-json`
  ve Codex CLI `--json`) ve varsa son agent mesajını ve oturum
  tanımlayıcılarını çıkarır.
- `output: "text"`, stdout'u son yanıt olarak ele alır.

Girdi modları:

- `input: "arg"` (varsayılan), istemi son CLI bağımsız değişkeni olarak geçirir.
- `input: "stdin"`, istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlıysa stdin kullanılır.

## Varsayılanlar (eklenti sahibi)

Paketlenmiş Anthropic eklentisi, `claude-cli` için bir varsayılan kaydeder:

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

Paketlenmiş OpenAI eklentisi de `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketlenmiş Google eklentisi de `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulu olmalı ve `PATH` üzerinde
`gemini` olarak erişilebilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım `stats` alanına geri düşer.
- `stats.cached`, OpenClaw `cacheRead` içine normalize edilir.
- `stats.input` eksikse OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Eklentiye ait varsayılanlar

CLI arka uç varsayılanları artık eklenti yüzeyinin bir parçasıdır:

- Eklentiler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id`, model referanslarında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı config'i yine eklenti varsayılanını geçersiz kılar.
- Arka uca özgü config temizliği, isteğe bağlı
  `normalizeConfig` hook'u aracılığıyla eklenti sahipliğinde kalır.

## Bundle MCP bindirmeleri

CLI arka uçları **OpenClaw araç çağrılarını doğrudan** almaz, ancak bir arka uç
`bundleMcp: true` ile oluşturulan bir MCP config bindirmesine dahil olabilir.

Mevcut paketlenmiş davranış:

- `claude-cli`: `bundleMcp: true` (varsayılan)
- `codex-cli`: bundle MCP bindirmesi yok
- `google-gemini-cli`: bundle MCP bindirmesi yok

Bundle MCP etkin olduğunda OpenClaw:

- gateway araçlarını CLI sürecine açan bir loopback HTTP MCP sunucusu başlatır
- köprüyü oturum başına bir token ile doğrular (`OPENCLAW_MCP_TOKEN`)
- araç erişimini mevcut oturum, hesap ve kanal bağlamıyla sınırlar
- mevcut çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları var olan herhangi bir arka uç `--mcp-config` değeriyle birleştirir
- CLI bağımsız değişkenlerini `--strict-mcp-config --mcp-config <generated-file>` geçecek şekilde yeniden yazar

`--strict-mcp-config` bayrağı, Claude CLI'nin ortamdan gelen
kullanıcı düzeyi veya global MCP sunucularını devralmasını engeller. MCP sunucusu etkin değilse bile OpenClaw,
arka plan çalıştırmalarının yalıtılmış kalması için yine de katı boş bir config enjekte eder.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrıları yoktur.** OpenClaw, araç çağrılarını
  CLI arka uç protokolüne enjekte etmez. Ancak `bundleMcp: true` olan arka uçlar (varsayılan
  Claude CLI davranışı), gateway araçlarını bir loopback MCP köprüsü üzerinden alır,
  böylece Claude CLI, OpenClaw araçlarını yerel MCP desteği aracılığıyla çağırabilir.
- **Akış arka uca özeldir.** Claude CLI, JSONL akışı kullanır
  (`--include-partial-messages` ile `stream-json`); diğer CLI arka uçları ise
  çıkışa kadar tamponlanmış kalabilir.
- **Yapılandırılmış çıktılar**, CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları**, düz metin çıktısıyla yeniden başlatılır (JSONL yoktur), bu da
  ilk `--json` çalıştırmasından daha az yapılandırılmıştır. OpenClaw oturumları yine de normal şekilde çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` için tam yol ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlı olduğundan ve `sessionMode` değerinin
  `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla yeniden başlatamaz).
- **Görüntüler yok sayılıyor**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).
