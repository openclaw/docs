---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir fallback istiyorsunuz
    - Codex CLI veya başka yerel AI CLI'leri çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz
    - CLI backend araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI backend''leri: isteğe bağlı MCP araç köprüsü ile yerel AI CLI fallback''i'
title: CLI backend'leri
x-i18n:
    generated_at: "2026-04-24T09:08:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI backend'leri (fallback çalışma zamanı)

OpenClaw, API sağlayıcıları devre dışı kaldığında,
hız sınırına takıldığında veya geçici olarak hatalı davrandığında **yerel AI CLI**'leri **yalnızca metin tabanlı bir fallback** olarak çalıştırabilir. Bu yaklaşım bilerek temkinlidir:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan backend'ler gateway araçlarını bir local loopback MCP köprüsü üzerinden alabilir.
- Bunu destekleyen CLI'ler için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip turları tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler geçirilebilir**.

Bu, birincil yol olmaktan ziyade **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere güvenmeden
"her zaman çalışan" metin yanıtları istediğinizde kullanın.

ACP oturum denetimleri, arka plan görevleri,
iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları olan tam bir harness çalışma zamanı istiyorsanız
bunun yerine [ACP Agents](/tr/tools/acp-agents) kullanın. CLI backend'leri ACP değildir.

## Başlangıç dostu hızlı başlangıç

Codex CLI'yi **hiç yapılandırma olmadan** kullanabilirsiniz (paketli OpenAI plugin'i
varsayılan bir backend kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway'iniz launchd/systemd altında çalışıyorsa ve PATH minimal ise yalnızca
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

Hepsi bu. CLI'nin kendisi dışında anahtar, ek auth yapılandırması gerekmez.

Gateway sunucusunda paketli bir CLI backend'ini **birincil mesaj sağlayıcısı** olarak kullanıyorsanız,
yapılandırmanız bir model referansında veya
`agents.defaults.cliBackends` altında o backend'e açıkça başvurduğunda OpenClaw artık sahibi olan paketli plugin'i otomatik yükler.

## Bunu fallback olarak kullanma

Bir CLI backend'ini fallback listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Notlar:

- `agents.defaults.models` (allowlist) kullanıyorsanız, CLI backend modellerinizi de buraya eklemelisiniz.
- Birincil sağlayıcı başarısız olursa (auth, hız sınırları, zaman aşımları), OpenClaw
  sıradaki CLI backend'ini dener.

## Yapılandırma genel bakışı

Tüm CLI backend'leri şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her girdi bir **sağlayıcı kimliği** ile anahtarlanır (ör. `codex-cli`, `my-cli`).
Sağlayıcı kimliği model referansınızın sol tarafı olur:

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
          // Codex tarzı CLI'ler bunun yerine bir prompt dosyasına işaret edebilir:
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

1. Sağlayıcı önekine göre (`codex-cli/...`) bir backend **seçer**.
2. Aynı OpenClaw prompt'u + çalışma alanı bağlamını kullanarak bir sistem prompt'u **oluşturur**.
3. Geçmiş tutarlı kalsın diye (destekleniyorsa) bir oturum kimliği ile CLI'yi **çalıştırır**.
   Paketli `claude-cli` backend'i, OpenClaw oturumu başına bir Claude stdio sürecini canlı tutar
   ve takip turlarını stream-json stdin üzerinden gönderir.
4. Çıktıyı (`JSON` veya düz metin) **ayrıştırır** ve son metni döndürür.
5. Backend başına oturum kimliklerini **kalıcılaştırır**, böylece takipler aynı CLI oturumunu yeniden kullanır.

<Note>
Paketli Anthropic `claude-cli` backend'i yeniden destekleniyor. Anthropic çalışanları
bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle Anthropic yeni
bir ilke yayımlamadıkça OpenClaw, bu entegrasyon için `claude -p` kullanımını onaylanmış kabul eder.
</Note>

Paketli OpenAI `codex-cli` backend'i, OpenClaw'ın sistem prompt'unu
Codex'in `model_instructions_file` yapılandırma geçersiz kılması (`-c
model_instructions_file="..."`) üzerinden geçirir. Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmaz; bu nedenle OpenClaw, her yeni Codex CLI oturumu için
birleştirilmiş prompt'u geçici bir dosyaya yazar.

Paketli Anthropic `claude-cli` backend'i OpenClaw Skills anlık görüntüsünü
iki yoldan alır: eklenen sistem prompt'undaki kompakt OpenClaw Skills kataloğu ve
`--plugin-dir` ile geçirilen geçici bir Claude Code plugin'i. Plugin yalnızca o agent/oturum için uygun Skills'i içerir, böylece Claude Code'un yerel skill çözücüsü OpenClaw'ın prompt'ta duyuracağı aynı filtrelenmiş kümeyi görür. Skill env/API anahtarı geçersiz kılmaları yine çalıştırma için alt sürecin ortamına OpenClaw tarafından uygulanır.

Claude CLI'nin ayrıca kendi etkileşimsiz izin modu vardır. OpenClaw bunu
Claude'a özgü yapılandırma eklemek yerine mevcut exec ilkesine eşler: etkin
istenen exec ilkesi YOLO olduğunda (`tools.exec.security: "full"` ve
`tools.exec.ask: "off"`), OpenClaw `--permission-mode bypassPermissions` ekler.
Agent başına `agents.list[].tools.exec` ayarları, o agent için genel `tools.exec` değerlerini geçersiz kılar.
Farklı bir Claude modunu zorlamak için
`agents.defaults.cliBackends.claude-cli.args` altında `--permission-mode default` veya `--permission-mode acceptEdits`
gibi açık ham backend argümanları ve eşleşen `resumeArgs` ayarlayın.

OpenClaw, paketli `claude-cli` backend'ini kullanabilmeden önce Claude Code'un kendisi
aynı host üzerinde zaten oturum açmış olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` binary'si zaten `PATH` üzerinde değilse yalnızca `agents.defaults.cliBackends.claude-cli.command` kullanın.

## Oturumlar

- CLI oturumları destekliyorsa `sessionArg` (ör. `--session-id`) veya
  kimliğin birden fazla bayrağa eklenmesi gerektiğinde `sessionArgs` (`{sessionId}` yer tutuculu) ayarlayın.
- CLI, farklı bayraklara sahip bir **resume alt komutu** kullanıyorsa
  `resumeArgs` ayarlayın (devam ederken `args` yerine geçer) ve isteğe bağlı olarak
  `resumeOutput` ayarlayın (JSON olmayan resume'ler için).
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklı yoksa yeni UUID).
  - `existing`: yalnızca daha önce bir kimlik saklandıysa oturum kimliği gönderir.
  - `none`: asla oturum kimliği göndermez.
- `claude-cli`, varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"`,
  ve `input: "stdin"` kullanır; böylece takip turları etkin olduğu sürece canlı Claude sürecini yeniden kullanır.
  Sıcak stdio artık varsayılandır; taşıma alanlarını atlayan özel yapılandırmalarda da böyledir.
  Gateway yeniden başlarsa veya boşta duran süreç çıkarsa OpenClaw, saklanan Claude oturum kimliğinden devam eder.
  Saklanan oturum kimlikleri, devam etmeden önce okunabilir mevcut bir proje dökümüne karşı doğrulanır;
  böylece hayalet bağlamalar `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine
  `reason=transcript-missing` ile temizlenir.
- Saklanan CLI oturumları, sağlayıcıya ait sürekliliktir. Örtük günlük oturum
  sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` ilkeleri yine keser.

Serileştirme notları:

- `serialize: true`, aynı hat çalıştırmalarını sıralı tutar.
- Çoğu CLI, tek bir sağlayıcı hattında serileştirme yapar.
- Seçilen auth kimliği değiştiğinde OpenClaw, saklanan CLI oturum yeniden kullanımını bırakır;
  buna auth profile id değişikliği, statik API anahtarı, statik token veya
  CLI bunu gösteriyorsa OAuth hesap kimliği değişikliği dahildir. OAuth erişim ve yenileme token'ı
  rotasyonu saklanan CLI oturumunu kesmez. Bir CLI kararlı OAuth hesap kimliği göstermiyorsa,
  OpenClaw o CLI'nin resume izinlerini uygulamasına izin verir.

## Görüntüler (geçirme)

CLI'niz görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw, base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlıysa bu
yollar CLI argümanları olarak geçirilir. `imageArg` yoksa OpenClaw, dosya
yollarını prompt'a ekler (path injection); bu, yerel dosyaları düz yollardan otomatik
yükleyen CLI'ler için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan), JSON ayrıştırmaya ve metin + oturum kimliğini çıkarmaya çalışır.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksikse veya boşsa
  yanıt metnini `response` alanından ve kullanımı `stats` alanından okur.
- `output: "jsonl"`, JSONL akışlarını ayrıştırır (örneğin Codex CLI `--json`) ve varsa son agent mesajını artı oturum
  tanımlayıcılarını çıkarır.
- `output: "text"`, stdout'u son yanıt olarak değerlendirir.

Girdi modları:

- `input: "arg"` (varsayılan), prompt'u son CLI argümanı olarak geçirir.
- `input: "stdin"`, prompt'u stdin üzerinden gönderir.
- Prompt çok uzunsa ve `maxPromptArgChars` ayarlıysa stdin kullanılır.

## Varsayılanlar (plugin'e ait)

Paketli OpenAI plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketli Google plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Önkoşul: yerel Gemini CLI kurulmuş olmalı ve
`PATH` üzerinde `gemini` olarak erişilebilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım `stats` alanına geri düşer.
- `stats.cached`, OpenClaw `cacheRead` biçimine normalize edilir.
- `stats.input` eksikse OpenClaw, giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI backend varsayılanları artık plugin yüzeyinin parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Backend `id`, model referanslarındaki sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine plugin varsayılanını geçersiz kılar.
- Backend'e özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` hook'u ile plugin'e ait kalır.

Küçük prompt/mesaj uyumluluk shim'lerine ihtiyaç duyan plugin'ler,
bir sağlayıcıyı veya CLI backend'ini değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

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

`input`, CLI'ye geçirilen sistem prompt'unu ve kullanıcı prompt'unu yeniden yazar. `output`
ise OpenClaw kendi denetim işaretleyicilerini ve kanal teslimini işlemeden önce
akışlı assistant delta'larını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json uyumlu JSONL yayan CLI'ler için,
o backend'in yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP overlay'leri

CLI backend'leri OpenClaw araç çağrılarını **doğrudan** almaz, ancak bir backend
`bundleMcp: true` ile üretilmiş bir MCP yapılandırma overlay'ine dahil olabilir.

Geçerli paketli davranış:

- `claude-cli`: üretilmiş katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları; üretilmiş
  OpenClaw local loopback sunucusu, Codex'in sunucu başına araç onay modu ile işaretlenir;
  böylece MCP çağrıları yerel onay istemlerinde takılı kalamaz
- `google-gemini-cli`: üretilmiş Gemini sistem ayarları dosyası

Bundle MCP etkin olduğunda OpenClaw:

- CLI sürecine gateway araçlarını açan bir local loopback HTTP MCP sunucusu başlatır
- köprüyü oturum başına bir token ile (`OPENCLAW_MCP_TOKEN`) kimlik doğrular
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları mevcut backend MCP yapılandırması/ayarları şekliyle birleştirir
- başlatma yapılandırmasını, sahibi olan extension'daki backend'e ait entegrasyon modunu kullanarak yeniden yazar

MCP sunucularından hiçbiri etkin değilse, OpenClaw yine de bir
backend bundle MCP'ye dahil olduğunda katı bir yapılandırma enjekte eder; böylece arka plan çalıştırmaları yalıtılmış kalır.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrıları yoktur.** OpenClaw, araç çağrılarını
  CLI backend protokolüne doğrudan enjekte etmez. Backend'ler gateway araçlarını yalnızca
  `bundleMcp: true` ile dahil olurlarsa görür.
- **Akış backend'e özgüdür.** Bazı backend'ler JSONL akışı yapar; diğerleri
  çıkışa kadar tamponlar.
- **Yapılandırılmış çıktılar**, CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları**, metin çıktısı üzerinden devam eder (JSONL yoktur); bu,
  ilk `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw oturumları yine normal çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlandığından ve `sessionMode` değerinin
  `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla devam edemez).
- **Görüntüler yok sayılıyor**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway runbook](/tr/gateway)
- [Local models](/tr/gateway/local-models)
