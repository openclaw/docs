---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir yedek çözüm istersiniz
    - Codex CLI veya diğer yerel yapay zeka CLI'larını çalıştırıyor ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel yapay zekâ CLI yedeği'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-05-02T08:53:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları kapalıyken, hız sınırına takılmışken veya geçici olarak hatalı davranırken **yalnızca metin yedeği** olarak **yerel AI CLI'leri** çalıştırabilir. Bu, bilinçli olarak temkinli tasarlanmıştır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan arka uçlar
  bir loopback MCP köprüsü üzerinden gateway araçlarını alabilir.
- Destekleyen CLI'ler için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip eden turlar tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler geçirilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere bağlı kalmadan
“her zaman çalışır” metin yanıtları istediğinizde bunu kullanın.

ACP oturum kontrolleri, arka plan görevleri, iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları içeren eksiksiz bir harness runtime istiyorsanız bunun yerine
[ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Yeni başlayanlar için hızlı başlangıç

Codex CLI'yi **herhangi bir config olmadan** kullanabilirsiniz (paketlenmiş OpenAI plugin'i
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway'iniz launchd/systemd altında çalışıyorsa ve PATH sınırlıysa, yalnızca
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

Bu kadar. CLI'nin kendisi dışında anahtar veya ek kimlik doğrulama config'i gerekmez.

Paketlenmiş bir CLI arka ucunu bir gateway host'unda **birincil mesaj sağlayıcısı** olarak kullanırsanız, config'iniz bir model ref içinde veya
`agents.defaults.cliBackends` altında o arka uca açıkça başvurduğunda OpenClaw artık sahibi olan paketlenmiş plugin'i otomatik olarak yükler.

## Bunu yedek olarak kullanma

CLI arka ucunu fallback listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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

- `agents.defaults.models` (izin listesi) kullanıyorsanız, CLI arka uç modellerinizi de oraya eklemeniz gerekir.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw
  sonraki olarak CLI arka ucunu dener.

## Yapılandırma özeti

Tüm CLI arka uçları şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her giriş, bir **sağlayıcı id** ile anahtarlanır (ör. `codex-cli`, `my-cli`).
Sağlayıcı id, model ref'inizin sol tarafı olur:

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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
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

1. Sağlayıcı prefix'ine (`codex-cli/...`) göre **bir arka uç seçer**.
2. Aynı OpenClaw prompt'unu + workspace bağlamını kullanarak **bir system prompt oluşturur**.
3. Geçmişin tutarlı kalması için (destekleniyorsa) CLI'yi bir oturum id'siyle **çalıştırır**.
   Paketlenmiş `claude-cli` arka ucu, her OpenClaw oturumu için bir Claude stdio sürecini canlı tutar ve takip turlarını stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. Takip turlarının aynı CLI oturumunu yeniden kullanması için her arka uç başına **oturum id'lerini kalıcı hale getirir**.

<Note>
Paketlenmiş Anthropic `claude-cli` arka ucu yeniden destekleniyor. Anthropic personeli,
OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize söyledi; bu nedenle OpenClaw,
Anthropic yeni bir policy yayımlamadığı sürece bu entegrasyon için `claude -p` kullanımını onaylı kabul eder.
</Note>

Paketlenmiş OpenAI `codex-cli` arka ucu, OpenClaw'ın system prompt'unu
Codex'in `model_instructions_file` config override'ı (`-c
model_instructions_file="..."`) üzerinden geçirir. Codex, Claude tarzı bir
`--append-system-prompt` flag'i sunmaz; bu nedenle OpenClaw, her yeni Codex CLI oturumu için birleştirilmiş prompt'u geçici bir dosyaya yazar.

Paketlenmiş Anthropic `claude-cli` arka ucu OpenClaw skills snapshot'ını iki yoldan alır: eklenen system prompt içindeki kompakt OpenClaw skills kataloğu ve
`--plugin-dir` ile geçirilen geçici bir Claude Code plugin'i. Plugin yalnızca o agent/oturum için uygun skills'leri içerir; böylece Claude Code'un yerel skill çözücüsü, OpenClaw'ın aksi halde prompt'ta duyuracağı aynı filtrelenmiş kümeyi görür. Skill env/API key override'ları çalıştırma için OpenClaw tarafından child process ortamına yine uygulanır.

Claude CLI'nin ayrıca kendi etkileşimsiz izin modu vardır. OpenClaw bunu Claude'a özgü config eklemek yerine mevcut exec policy'ye eşler: etkin istenen exec policy YOLO olduğunda (`tools.exec.security: "full"` ve
`tools.exec.ask: "off"`), OpenClaw `--permission-mode bypassPermissions` ekler.
Agent başına `agents.list[].tools.exec` ayarları, o agent için global `tools.exec` ayarını geçersiz kılar. Farklı bir Claude modunu zorlamak için
`agents.defaults.cliBackends.claude-cli.args` ve eşleşen `resumeArgs` altında
`--permission-mode default` veya `--permission-mode acceptEdits` gibi açık raw arka uç argümanları ayarlayın.

OpenClaw paketlenmiş `claude-cli` arka ucunu kullanmadan önce Claude Code'un kendisi aynı host'ta zaten oturum açmış olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`agents.defaults.cliBackends.claude-cli.command` değerini yalnızca `claude`
binary'si zaten `PATH` üzerinde değilse kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, ID'nin birden çok flag içine eklenmesi gerektiğinde `sessionArg` (ör. `--session-id`) veya
  `sessionArgs` (placeholder `{sessionId}`) ayarlayın.
- CLI farklı flag'lere sahip bir **resume subcommand** kullanıyorsa,
  `resumeArgs` (devam ederken `args` yerine geçer) ve isteğe bağlı olarak `resumeOutput`
  (JSON olmayan devamlar için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum id'si gönder (saklanan yoksa yeni UUID).
  - `existing`: yalnızca daha önce saklanmışsa bir oturum id'si gönder.
  - `none`: hiçbir zaman oturum id'si gönderme.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve `input: "stdin"` kullanır; böylece takip turları, aktifken canlı Claude sürecini yeniden kullanır. Sıcak stdio artık varsayılandır; transport alanlarını atlayan özel config'ler de buna dahildir. Gateway yeniden başlarsa veya boşta duran süreç çıkarsa, OpenClaw saklanan Claude oturum id'sinden devam eder. Saklanan oturum id'leri, devam etmeden önce mevcut okunabilir bir proje transcript'ine karşı doğrulanır; böylece hayalet bağlamalar `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine `reason=transcript-missing` ile temizlenir.
- Claude canlı oturumları sınırlı JSONL çıktı korumalarını tutar. Varsayılanlar tur başına 8 MiB ve 20.000 raw JSONL satırına kadar izin verir. Araç yoğun Claude turları bunları arka uç başına
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  ve `maxTurnLines` ile artırabilir; OpenClaw bu ayarları 64 MiB ve 100.000 satırla sınırlar.
- Saklanan CLI oturumları, sağlayıcıya ait sürekliliktir. Örtük günlük oturum reset'i bunları kesmez; `/reset` ve açık `session.reset` policy'leri yine keser.

Serileştirme notları:

- `serialize: true` aynı lane çalıştırmalarını sıralı tutar.
- Çoğu CLI tek bir sağlayıcı lane'inde serileştirir.
- Seçilen auth identity değiştiğinde OpenClaw saklanan CLI oturumu yeniden kullanımını bırakır; buna değişen auth profile id, statik API key, statik token veya CLI bir OAuth hesap identity'si açığa çıkarıyorsa OAuth hesap identity'si dahildir. OAuth erişim ve yenileme token'ı rotasyonu saklanan CLI oturumunu kesmez. Bir CLI kararlı bir OAuth hesap id'si açığa çıkarmıyorsa OpenClaw, resume izinlerini o CLI'nin uygulamasına izin verir.

## claude-cli oturumlarından fallback başlangıcı

Bir `claude-cli` denemesi [`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki CLI olmayan bir adaya devredildiğinde, OpenClaw sonraki denemeyi Claude Code'un `~/.claude/projects/` konumundaki yerel JSONL transcript'inden toplanan bir bağlam başlangıcıyla besler. Bu seed olmadan fallback sağlayıcısı soğuk başlardı, çünkü OpenClaw'ın kendi oturum transcript'i `claude-cli` çalıştırmaları için boştur.

- Başlangıç, en son `/compact` özetini veya `compact_boundary`
  marker'ını tercih eder, sonra char budget'a kadar en son sınır sonrası turları ekler. Sınır öncesi turlar atılır, çünkü özet zaten onları temsil eder.
- Tool blokları, prompt budget'ını dürüst tutmak için kompakt `(tool call: name)` ve
  `(tool result: …)` ipuçlarına birleştirilir. Özet taşarsa `(truncated)` etiketiyle işaretlenir.
- Aynı sağlayıcı `claude-cli` ile `claude-cli` fallback'leri Claude'un kendi
  `--resume` özelliğine dayanır ve başlangıcı atlar.
- Seed mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; bu nedenle
  keyfi yollar okunamaz.

## Görüntüler (geçirme)

CLI'niz görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntülerini temp dosyalarına yazar. `imageArg` ayarlanmışsa, bu yollar CLI argümanları olarak geçirilir. `imageArg` yoksa, OpenClaw dosya yollarını prompt'a ekler (path injection); bu, düz yollardan yerel dosyaları otomatik yükleyen CLI'ler için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan) JSON ayrıştırmayı ve metin + oturum id'si çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` alanından ve kullanımı `stats` alanından okur.
- `output: "jsonl"` JSONL akışlarını ayrıştırır (örneğin Codex CLI `--json`) ve varsa son agent mesajını ve oturum tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u son yanıt olarak ele alır.

Girdi modları:

- `input: "arg"` (varsayılan) prompt'u son CLI argümanı olarak geçirir.
- `input: "stdin"` prompt'u stdin üzerinden gönderir.
- Prompt çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (plugin'e ait)

Paketlenmiş OpenAI plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketlenmiş Google plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulmuş ve `PATH` üzerinde
`gemini` olarak kullanılabilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım `stats` alanına fallback eder.
- `stats.cached`, OpenClaw `cacheRead` olarak normalize edilir.
- `stats.input` eksikse, OpenClaw girdi token'larını
  `stats.input_tokens - stats.cached` değerinden türetir.

Yalnızca gerekiyorsa override edin (yaygın: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka uç varsayılanları artık plugin yüzeyinin parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Backend `id` değeri, model referanslarında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine Plugin varsayılanını geçersiz kılar.
- Backend'e özel yapılandırma temizliği, isteğe bağlı `normalizeConfig` kancası üzerinden Plugin sahipliğinde kalır.

Küçük prompt/mesaj uyumluluk dolgularına ihtiyaç duyan Plugin'ler, bir sağlayıcıyı veya CLI backend'ini değiştirmeden çift yönlü metin dönüşümleri tanımlayabilir:

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

`input`, CLI'ye geçirilen sistem prompt'unu ve kullanıcı prompt'unu yeniden yazar. `output`, OpenClaw kendi denetim işaretleyicilerini ve kanal teslimini işlemeden önce akışa verilen asistan deltalarını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json uyumlu JSONL yayan CLI'ler için, ilgili backend yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## Paket MCP katmanları

CLI backend'leri OpenClaw araç çağrılarını doğrudan almaz, ancak bir backend `bundleMcp: true` ile oluşturulan bir MCP yapılandırma katmanına katılabilir.

Geçerli paket davranışı:

- `claude-cli`: oluşturulan katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları; oluşturulan OpenClaw loopback sunucusu, MCP çağrılarının yerel onay prompt'larında takılı kalmaması için Codex'in sunucu başına araç onay moduyla işaretlenir
- `google-gemini-cli`: oluşturulan Gemini sistem ayarları dosyası

Paket MCP etkinleştirildiğinde, OpenClaw:

- Gateway araçlarını CLI sürecine açan bir loopback HTTP MCP sunucusu başlatır
- köprünün kimliğini oturum başına token (`OPENCLAW_MCP_TOKEN`) ile doğrular
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin paket-MCP sunucularını yükler
- bunları mevcut backend MCP yapılandırması/ayarları biçimiyle birleştirir
- başlatma yapılandırmasını, sahip uzantıdan gelen backend sahipliğindeki entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse, OpenClaw yine de bir backend paket MCP'ye katıldığında arka plan çalıştırmalarının yalıtılmış kalması için katı bir yapılandırma enjekte eder.

Oturum kapsamlı paket MCP çalışma zamanları, bir oturum içinde yeniden kullanılmak üzere önbelleğe alınır, ardından `mcp.sessionIdleTtlMs` milisaniye boşta kalma süresinden sonra temizlenir (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama yoklamaları, slug oluşturma ve Active Memory geri çağırma isteği gibi tek seferlik gömülü çalıştırmalar, stdio alt süreçlerinin ve Streamable HTTP/SSE akışlarının çalıştırmadan daha uzun yaşamaması için çalıştırma sonunda temizlik yapar.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yoktur.** OpenClaw, CLI backend protokolüne araç çağrıları enjekte etmez. Backend'ler Gateway araçlarını yalnızca `bundleMcp: true` ile katıldıklarında görür.
- **Akış backend'e özeldir.** Bazı backend'ler JSONL akışı verir; diğerleri çıkışa kadar tamponlar.
- **Yapılandırılmış çıktılar** CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden sürdürülür (JSONL yoktur), bu da ilk `--json` çalıştırmasından daha az yapılandırılmıştır. OpenClaw oturumları yine normal şekilde çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlandığından ve `sessionMode` değerinin `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla sürdüremez).
- **Görseller yok sayılıyor**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway çalıştırma kitabı](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
