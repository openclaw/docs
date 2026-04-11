---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir geri dönüş seçeneği istersiniz
    - Codex CLI veya diğer yerel AI CLI'leri çalıştırıyor ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka ucu araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel AI CLI geri dönüşü'
title: CLI Arka Uçları
x-i18n:
    generated_at: "2026-04-11T02:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d108dbea043c260a80d15497639298f71a6b4d800f68d7b39bc129f7667ca608
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI arka uçları (geri dönüş çalışma zamanı)

OpenClaw, API sağlayıcıları devre dışı kaldığında, hız sınırına takıldığında
veya geçici olarak hatalı davrandığında **yalnızca metin tabanlı bir geri dönüş**
olarak **yerel AI CLI'leri** çalıştırabilir. Bu özellikle temkinli tasarlanmıştır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan
  arka uçlar bir loopback MCP köprüsü üzerinden gateway araçlarını alabilir.
- Bunu destekleyen CLI'ler için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip eden dönüşler tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görseller iletilebilir**.

Bu, birincil yol olmaktan ziyade bir **güvenlik ağı** olarak tasarlanmıştır. Bunu,
harici API'lere güvenmeden “her zaman çalışır” metin yanıtları istediğinizde kullanın.

ACP oturum kontrolleri, arka plan görevleri,
iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları içeren tam bir
harness çalışma zamanı istiyorsanız bunun yerine
[ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Yeni başlayanlar için hızlı başlangıç

Codex CLI'yi **hiç yapılandırma olmadan** kullanabilirsiniz (paketli OpenAI eklentisi
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gateway'niz launchd/systemd altında çalışıyorsa ve PATH minimumsa, yalnızca
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

Hepsi bu. CLI'nin kendisi dışında anahtar, ek kimlik doğrulama yapılandırması gerekmez.

Bir gateway ana bilgisayarında paketli bir CLI arka ucunu **birincil mesaj sağlayıcısı**
olarak kullanırsanız, OpenClaw artık yapılandırmanız bu arka uca açıkça bir model
referansında veya `agents.defaults.cliBackends` altında başvuruyorsa ilgili paketli
eklenti otomatik olarak yükler.

## Bunu geri dönüş olarak kullanma

Bir CLI arka ucunu geri dönüş listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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

- `agents.defaults.models` (izin listesi) kullanıyorsanız, CLI arka ucu modellerinizi de buraya eklemelisiniz.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw
  sırada CLI arka ucunu dener.

## Yapılandırma özeti

Tüm CLI arka uçları şurada bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **sağlayıcı kimliği** ile anahtarlanır (`codex-cli`, `my-cli` gibi).
Sağlayıcı kimliği, model referansınızın sol tarafı olur:

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

1. Sağlayıcı önekine göre (`codex-cli/...`) bir **arka uç seçer**.
2. Aynı OpenClaw istemi + çalışma alanı bağlamını kullanarak bir **sistem istemi oluşturur**.
3. Geçmiş tutarlı kalsın diye CLI'yi bir oturum kimliğiyle (destekleniyorsa) **çalıştırır**.
4. Çıktıyı (JSON veya düz metin) **ayrıştırır** ve son metni döndürür.
5. Takip eden işlemler aynı CLI oturumunu yeniden kullansın diye arka uç başına oturum kimliklerini **kalıcı hale getirir**.

<Note>
Paketli Anthropic `claude-cli` arka ucu yeniden desteklenmektedir. Anthropic çalışanları
bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle
Anthropic yeni bir politika yayımlamadıkça OpenClaw bu entegrasyon için
`claude -p` kullanımını onaylı kabul eder.
</Note>

Paketli OpenAI `codex-cli` arka ucu, OpenClaw'ın sistem istemini
Codex'in `model_instructions_file` yapılandırma geçersiz kılmasına (`-c
model_instructions_file="..."`) iletir. Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmadığından OpenClaw her yeni Codex CLI
oturumu için birleştirilmiş istemi geçici bir dosyaya yazar.

Paketli Anthropic `claude-cli` arka ucu, OpenClaw Skills anlık görüntüsünü
iki şekilde alır: eklenmiş sistem istemindeki kompakt OpenClaw Skills kataloğu
ve `--plugin-dir` ile geçirilen geçici bir Claude Code eklentisi. Eklenti,
yalnızca o aracı/oturum için uygun Skills öğelerini içerir; böylece Claude Code'un
yerel skill çözücüsü, OpenClaw'ın aksi halde istemde duyuracağı aynı filtrelenmiş
kümesi görür. Skill env/API anahtarı geçersiz kılmaları yine de bu çalıştırma için
alt süreç ortamına OpenClaw tarafından uygulanır.

## Oturumlar

- CLI oturumları destekliyorsa `sessionArg` (`--session-id` gibi) veya
  kimliğin birden çok bayrağa eklenmesi gerektiğinde `sessionArgs`
  (`{sessionId}` yer tutucusu) ayarlayın.
- CLI farklı bayraklarla bir **resume alt komutu** kullanıyorsa,
  `resumeArgs` ayarlayın (sürdürürken `args` yerine geçer) ve isteğe bağlı olarak
  `resumeOutput` ayarlayın (JSON olmayan sürdürmeler için).
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklanan yoksa yeni UUID).
  - `existing`: yalnızca daha önce bir kimlik saklandıysa oturum kimliği gönderir.
  - `none`: asla oturum kimliği göndermez.

Serileştirme notları:

- `serialize: true`, aynı hat üzerindeki çalıştırmaların sıralı kalmasını sağlar.
- Çoğu CLI tek bir sağlayıcı hattında serileştirme yapar.
- OpenClaw, arka uç kimlik doğrulama durumu değiştiğinde saklanan CLI oturumu yeniden kullanımını bırakır; buna yeniden oturum açma, token rotasyonu veya değişmiş bir kimlik doğrulama profili kimlik bilgisi dahildir.

## Görseller (iletme)

CLI'niz görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görselleri geçici dosyalara yazar. `imageArg` ayarlanmışsa bu
yollar CLI bağımsız değişkenleri olarak geçirilir. `imageArg` eksikse OpenClaw
dosya yollarını isteme ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları
otomatik yükleyen CLI'ler için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan), JSON'u ayrıştırmayı ve metin + oturum kimliğini çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` alanından,
  kullanım bilgisini ise `stats` alanından okur.
- `output: "jsonl"`, JSONL akışlarını (örneğin Codex CLI `--json`) ayrıştırır ve mevcutsa son aracı mesajını artı oturum
  tanımlayıcılarını çıkarır.
- `output: "text"`, stdout'u son yanıt olarak kabul eder.

Girdi modları:

- `input: "arg"` (varsayılan), istemi son CLI bağımsız değişkeni olarak geçirir.
- `input: "stdin"`, istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlıysa stdin kullanılır.

## Varsayılanlar (eklenti sahipliğinde)

Paketli OpenAI eklentisi ayrıca `codex-cli` için bir varsayılan da kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketli Google eklentisi ayrıca `google-gemini-cli` için bir varsayılan da kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulmuş olmalı ve `PATH` üzerinde
`gemini` olarak erişilebilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON içindeki `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım bilgisi `stats` alanına geri döner.
- `stats.cached`, OpenClaw `cacheRead` alanına normalize edilir.
- `stats.input` eksikse OpenClaw giriş tokenlarını
  `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerektiğinde geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Eklenti sahipli varsayılanlar

CLI arka ucu varsayılanları artık eklenti yüzeyinin bir parçasıdır:

- Eklentiler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model referanslarındaki sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de eklenti varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` kancası üzerinden eklenti sahipliğinde kalır.

Küçük istem/mesaj uyumluluk uyarlamaları gereken eklentiler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden
çift yönlü metin dönüşümleri tanımlayabilir:

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
ise OpenClaw kendi denetim işaretleyicilerini ve kanal teslimini işlemeden önce
akışlı asistan deltalarını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json ile uyumlu JSONL üreten CLI'ler için,
o arka ucun yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP katmanları

CLI arka uçları **OpenClaw araç çağrılarını doğrudan** almaz, ancak bir arka uç
`bundleMcp: true` ile oluşturulmuş bir MCP yapılandırma katmanını etkinleştirebilir.

Geçerli paketli davranış:

- `claude-cli`: oluşturulmuş katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları
- `google-gemini-cli`: oluşturulmuş Gemini sistem ayarları dosyası

Bundle MCP etkin olduğunda OpenClaw:

- gateway araçlarını CLI sürecine açan bir loopback HTTP MCP sunucusu başlatır
- köprünün kimliğini oturum başına bir token ile doğrular (`OPENCLAW_MCP_TOKEN`)
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırması/ayar biçimiyle birleştirir
- başlatma yapılandırmasını ilgili uzantının sahip olduğu entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse bile, bir arka uç bundle MCP'yi etkinleştirirse
OpenClaw yine de katı bir yapılandırma enjekte eder; böylece arka plan çalıştırmaları yalıtılmış kalır.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrıları yok.** OpenClaw, CLI arka ucu protokolüne
  araç çağrıları enjekte etmez. Arka uçlar gateway araçlarını yalnızca
  `bundleMcp: true` ile etkinleştirdiklerinde görür.
- **Akış arka uca özeldir.** Bazı arka uçlar JSONL akışı yapar; diğerleri çıkışa
  kadar tamponlar.
- **Yapılandırılmış çıktılar**, CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları**, metin çıktısı üzerinden sürdürülür (JSONL yoktur); bu,
  ilk `--json` çalıştırmasından daha az yapılandırılmıştır. OpenClaw oturumları
  yine de normal çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` için tam yol ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlı olduğundan ve `sessionMode` değerinin
  `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla sürdüremez).
- **Görseller yok sayılıyor**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).
