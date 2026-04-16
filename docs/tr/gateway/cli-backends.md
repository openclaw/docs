---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir geri dönüş istersiniz
    - Codex CLI veya diğer yerel AI CLI'leri çalıştırıyor ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka ucu araç erişimi için MCP local loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsü ile yerel AI CLI geri dönüşü'
title: CLI Arka Uçları
x-i18n:
    generated_at: "2026-04-16T19:31:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 381273532a8622bc4628000a6fb999712b12af08faade2b5f2b7ac4cc7d23efe
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI arka uçları (geri dönüş çalışma zamanı)

OpenClaw, API sağlayıcıları kapalı olduğunda, hız sınırlamasına takıldığında
veya geçici olarak hatalı davrandığında **metinle sınırlı bir geri dönüş**
olarak **yerel AI CLI'leri** çalıştırabilir. Bu tasarım kasıtlı olarak temkinlidir:

- **OpenClaw araçları doğrudan eklenmez**, ancak `bundleMcp: true` olan arka uçlar
  araçları bir loopback MCP köprüsü üzerinden alabilir.
- Bunu destekleyen CLI'ler için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip eden turlar tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler iletilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Bunu,
harici API'lere güvenmeden “her zaman çalışan” metin yanıtları istediğinizde kullanın.

ACP oturum denetimleri, arka plan görevleri,
iz/konuşma bağlama ve kalıcı harici kodlama oturumları olan tam bir harness çalışma zamanı istiyorsanız,
bunun yerine [ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Yeni başlayanlar için hızlı başlangıç

Codex CLI'yi **hiç yapılandırma olmadan** kullanabilirsiniz (paketle gelen OpenAI Plugin
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gateway'iniz launchd/systemd altında çalışıyorsa ve PATH minimal ise, yalnızca
komut yolunu ekleyin:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Hepsi bu. CLI'nin kendisinin ötesinde anahtar, ek kimlik doğrulama yapılandırması gerekmez.

Paketle gelen bir CLI arka ucunu bir gateway ana bilgisayarında **birincil mesaj sağlayıcısı**
olarak kullanırsanız, yapılandırmanız bu arka uca bir model ref içinde veya
`agents.defaults.cliBackends` altında açıkça başvurduğunda OpenClaw artık ilgili paketli Plugin'i otomatik olarak yükler.

## Bunu geri dönüş olarak kullanma

Yalnızca birincil modeller başarısız olduğunda çalışması için geri dönüş listenize bir CLI arka ucu ekleyin:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Notlar:

- `agents.defaults.models` (izin listesi) kullanıyorsanız, CLI arka uç modellerinizi de oraya eklemeniz gerekir.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw
  sıradaki CLI arka ucunu dener.

## Yapılandırmaya genel bakış

Tüm CLI arka uçları şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **sağlayıcı kimliği** ile anahtarlanır (`codex-cli`, `my-cli` gibi).
Sağlayıcı kimliği, model ref'inizin sol tarafı olur:

```
<provider>/<model>
```

### Örnek yapılandırma

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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
          // Codex tarzı CLI'ler bunun yerine bir istem dosyasına işaret edebilir:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
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

1. Sağlayıcı önekine göre (`codex-cli/...`) bir arka uç **seçer**.
2. Aynı OpenClaw istemi + çalışma alanı bağlamını kullanarak bir sistem istemi **oluşturur**.
3. Geçmiş tutarlı kalsın diye CLI'yi bir oturum kimliğiyle (destekleniyorsa) **çalıştırır**.
4. Çıktıyı (JSON veya düz metin) **ayrıştırır** ve son metni döndürür.
5. Arka uç başına oturum kimliklerini **kalıcılaştırır**, böylece takip eden istekler aynı CLI oturumunu yeniden kullanır.

<Note>
Paketle gelen Anthropic `claude-cli` arka ucu yeniden desteklenmektedir. Anthropic çalışanları
bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu yüzden OpenClaw
Anthropic yeni bir ilke yayımlamadıkça bu entegrasyon için
`claude -p` kullanımını onaylanmış kabul eder.
</Note>

Paketle gelen OpenAI `codex-cli` arka ucu, OpenClaw'ın sistem istemini
Codex'in `model_instructions_file` yapılandırma geçersiz kılması (`-c
model_instructions_file="..."`) üzerinden geçirir. Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmaz, bu yüzden OpenClaw her yeni Codex CLI oturumu için
oluşturulan istemi geçici bir dosyaya yazar.

Paketle gelen Anthropic `claude-cli` arka ucu, OpenClaw Skills anlık görüntüsünü
iki yolla alır: eklenen sistem istemindeki kompakt OpenClaw Skills kataloğu ve
`--plugin-dir` ile geçirilen geçici bir Claude Code Plugin. Plugin yalnızca o agent/oturum için
uygun Skills öğelerini içerir; böylece Claude Code'un yerel beceri çözücüsü,
OpenClaw'ın istemde normalde duyuracağı aynı filtrelenmiş kümesi görür. Skill env/API anahtarı geçersiz kılmaları
çalıştırma için alt süreç ortamına yine OpenClaw tarafından uygulanır.

## Oturumlar

- CLI oturumları destekliyorsa, oturum kimliği gönderilmesi için `sessionArg` (`--session-id` gibi) veya
  kimliğin birden çok bayrağa eklenmesi gerekiyorsa
  `sessionArgs` (`{sessionId}` yer tutuculu) ayarlayın.
- CLI farklı bayraklara sahip bir **resume alt komutu** kullanıyorsa,
  `resumeArgs` ayarlayın (yeniden devam ederken `args` yerine geçer) ve isteğe bağlı olarak
  `resumeOutput` ayarlayın (JSON olmayan devamlar için).
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklanmış yoksa yeni bir UUID).
  - `existing`: yalnızca daha önce saklanmış bir oturum kimliği varsa gönderir.
  - `none`: hiçbir zaman oturum kimliği göndermez.

Serileştirme notları:

- `serialize: true`, aynı şeritteki çalıştırmaları sıralı tutar.
- Çoğu CLI tek bir sağlayıcı şeridinde serileştirme yapar.
- Kimlik doğrulama durumu değiştiğinde OpenClaw saklanan CLI oturumu yeniden kullanımını bırakır; buna yeniden giriş, belirteç döndürme veya değiştirilmiş kimlik doğrulama profili kimlik bilgisi dahildir.

## Görüntüler (iletim)

CLI'niz görüntü yollarını kabul ediyorsa, `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlanmışsa bu
yollar CLI bağımsız değişkenleri olarak geçirilir. `imageArg` eksikse OpenClaw
dosya yollarını isteme ekler (yol ekleme); bu, düz yollardan yerel dosyaları otomatik
yükleyen CLI'ler için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan), JSON ayrıştırmayı ve metin + oturum kimliği çıkarmayı dener.
- Gemini CLI JSON çıktısı için, `usage` eksik veya boş olduğunda OpenClaw yanıt metnini `response` alanından,
  kullanımı ise `stats` alanından okur.
- `output: "jsonl"`, JSONL akışlarını ayrıştırır (örneğin Codex CLI `--json`) ve mevcutsa son agent mesajını artı oturum
  tanımlayıcılarını çıkarır.
- `output: "text"`, stdout'u son yanıt olarak ele alır.

Girdi modları:

- `input: "arg"` (varsayılan), istemi son CLI bağımsız değişkeni olarak geçirir.
- `input: "stdin"`, istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (Plugin sahipliğinde)

Paketle gelen OpenAI Plugin ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketle gelen Google Plugin ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Önkoşul: yerel Gemini CLI kurulmuş olmalı ve PATH üzerinde
`gemini` olarak kullanılabilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım `stats` alanına geri döner.
- `stats.cached`, OpenClaw `cacheRead` değerine normalize edilir.
- `stats.input` eksikse OpenClaw girdi belirteçlerini
  `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın olan: mutlak `command` yolu).

## Plugin sahipliğindeki varsayılanlar

CLI arka ucu varsayılanları artık Plugin yüzeyinin bir parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model ref'lerdeki sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` kancası aracılığıyla Plugin sahipliğinde kalır.

Küçük istem/mesaj uyumluluk uyarlamalarına ihtiyaç duyan Plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden
iki yönlü metin dönüşümleri tanımlayabilir:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input`, CLI'ye geçirilen sistem istemini ve kullanıcı istemini yeniden yazar. `output`
ise OpenClaw kendi denetim işaretçilerini ve kanal teslimini işlemeden önce
akışlı asistan deltalarını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json uyumlu JSONL üreten CLI'ler için,
o arka ucun yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını **doğrudan** almaz, ancak bir arka uç
`bundleMcp: true` ile oluşturulmuş bir MCP yapılandırma katmanına katılabilir.

Mevcut paketli davranış:

- `claude-cli`: oluşturulmuş sıkı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları
- `google-gemini-cli`: oluşturulmuş Gemini sistem ayarları dosyası

Bundle MCP etkin olduğunda OpenClaw:

- CLI sürecine gateway araçlarını açan bir loopback HTTP MCP sunucusu başlatır
- köprüyü oturum başına bir belirteçle (`OPENCLAW_MCP_TOKEN`) kimlik doğrular
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırması/ayar şekliyle birleştirir
- başlatma yapılandırmasını sahip olan uzantının arka uç sahipliğindeki entegrasyon modunu kullanarak yeniden yazar

Hiç MCP sunucusu etkin değilse bile, OpenClaw bir arka uç bundle MCP'ye katıldığında
arka plandaki çalıştırmalar yalıtılmış kalsın diye yine de sıkı bir yapılandırma ekler.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrıları yoktur.** OpenClaw, araç çağrılarını
  CLI arka ucu protokolüne eklemez. Arka uçlar gateway araçlarını yalnızca
  `bundleMcp: true` ile katıldıklarında görür.
- **Akış arka uca özeldir.** Bazı arka uçlar JSONL akışı yapar; diğerleri
  çıkışa kadar arabelleğe alır.
- **Yapılandırılmış çıktılar**, CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları**, metin çıktısı üzerinden devam eder (JSONL yoktur); bu da
  ilk `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw oturumları yine de
  normal çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlı olduğundan ve `sessionMode` değerinin
  `none` olmadığından emin olun (`Codex CLI` şu anda JSON çıktısıyla devam edemez).
- **Görüntüler yok sayılıyor**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).
