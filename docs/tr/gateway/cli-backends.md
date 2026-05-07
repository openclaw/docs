---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir yedek mekanizma istersiniz
    - Codex CLI'yi veya diğer yerel yapay zeka CLI'lerini çalıştırıyor ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP geri döngü köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel yapay zeka CLI geri dönüşü'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-05-07T13:17:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları kapalı, hız sınırına takılmış veya geçici olarak hatalı davrandığında
**yalnızca metin yedeği** olarak **yerel yapay zeka CLI'lerini** çalıştırabilir. Bu, bilinçli olarak temkinli tasarlanmıştır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true`
  kullanan arka uçlar, local loopback MCP köprüsü üzerinden gateway araçları alabilir.
- Destekleyen CLI'ler için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip turları tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler geçirilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere
güvenmeden "her zaman çalışır" metin yanıtları istediğinizde kullanın.

ACP oturum kontrolleri, arka plan görevleri,
iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları içeren eksiksiz bir harness çalışma zamanı istiyorsanız,
bunun yerine [ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

<Tip>
  Yeni bir arka uç plugin mi oluşturuyorsunuz? 
  [CLI arka uç plugin'leri](/tr/plugins/cli-backend-plugins) kullanın. Bu sayfa, zaten kayıtlı bir arka ucu
  yapılandıran ve çalıştıran kullanıcılar içindir.
</Tip>

## Yeni başlayanlar için uygun hızlı başlangıç

Codex CLI'yi **hiçbir config olmadan** kullanabilirsiniz (paketle gelen OpenAI plugin'i
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
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

Hepsi bu. CLI'nin kendisinin ötesinde anahtar veya ek auth config gerekmez.

Bir Gateway ana makinesinde **birincil mesaj sağlayıcısı** olarak paketle gelen bir CLI arka ucu kullanırsanız,
config'iniz bir model referansında veya
`agents.defaults.cliBackends` altında bu arka uca açıkça referans verdiğinde OpenClaw artık sahip olan paketlenmiş plugin'i otomatik yükler.

## Yedek olarak kullanma

CLI arka ucunu yedek listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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

- `agents.defaults.models` (allowlist) kullanıyorsanız, CLI arka uç modellerinizi de oraya eklemeniz gerekir.
- Birincil sağlayıcı başarısız olursa (auth, hız sınırları, zaman aşımları), OpenClaw
  sırada CLI arka ucunu dener.

## Configuration genel bakışı

Tüm CLI arka uçları şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her girdi bir **sağlayıcı id** ile anahtarlanır (ör. `codex-cli`, `my-cli`).
Sağlayıcı id, model referansınızın sol tarafı olur:

```
<provider>/<model>
```

### Örnek configuration

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

## Nasıl çalışır?

1. Sağlayıcı önekine (`codex-cli/...`) göre **bir arka uç seçer**.
2. Aynı OpenClaw prompt + çalışma alanı bağlamını kullanarak **bir sistem prompt'u oluşturur**.
3. Geçmişin tutarlı kalması için CLI'yi bir oturum id'siyle (destekleniyorsa) **çalıştırır**.
   Paketle gelen `claude-cli` arka ucu, her OpenClaw oturumu için bir Claude stdio sürecini canlı tutar
   ve takip turlarını stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. Takip turlarının aynı CLI oturumunu yeniden kullanması için arka uç başına **oturum id'lerini kalıcılaştırır**.

<Note>
Paketle gelen Anthropic `claude-cli` arka ucu yeniden desteklenmektedir. Anthropic çalışanları
OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize söyledi; bu nedenle OpenClaw,
Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için
`claude -p` kullanımını onaylı kabul eder.
</Note>

Paketle gelen OpenAI `codex-cli` arka ucu, OpenClaw'ın sistem prompt'unu
Codex'in `model_instructions_file` config override'ı üzerinden geçirir (`-c
model_instructions_file="..."`). Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmaz; bu yüzden OpenClaw, her yeni Codex CLI oturumu için
birleştirilen prompt'u geçici bir dosyaya yazar.

Paketle gelen Anthropic `claude-cli` arka ucu, OpenClaw Skills anlık görüntüsünü
iki yolla alır: eklenen sistem prompt'undaki kompakt OpenClaw skills kataloğu ve
`--plugin-dir` ile geçirilen geçici bir Claude Code plugin'i. Plugin,
yalnızca o agent/oturum için uygun skills'i içerir; böylece Claude Code'un yerel skill çözümleyicisi,
OpenClaw'ın aksi halde prompt'ta duyuracağı aynı filtrelenmiş kümeyi görür.
Skill env/API anahtarı override'ları, çalışma için OpenClaw tarafından alt süreç ortamına hâlâ uygulanır.

Claude CLI'nin kendi etkileşimsiz izin modu da vardır. OpenClaw bunu,
Claude'a özel config eklemek yerine mevcut exec ilkesine eşler: etkin istenen exec ilkesi YOLO olduğunda (`tools.exec.security: "full"` ve
`tools.exec.ask: "off"`), OpenClaw `--permission-mode bypassPermissions` ekler.
Agent başına `agents.list[].tools.exec` ayarları, o agent için global `tools.exec` ayarlarını geçersiz kılar.
Farklı bir Claude modunu zorlamak için
`agents.defaults.cliBackends.claude-cli.args` altında `--permission-mode default` veya `--permission-mode acceptEdits` gibi açık raw arka uç arg'ları ve eşleşen `resumeArgs` ayarlayın.

Paketle gelen Anthropic `claude-cli` arka ucu ayrıca OpenClaw `/think` düzeylerini,
kapalı olmayan düzeyler için Claude Code'un yerel `--effort` bayrağına eşler. `minimal` ve
`low`, `low`'a; `adaptive` ve `medium`, `medium`'a; `high`,
`xhigh` ve `max` ise doğrudan eşlenir. Diğer CLI arka uçlarının, `/think` oluşturulan CLI'yi etkileyebilmeden önce
sahip olan plugin'lerinin eşdeğer bir argv eşleyici bildirmesi gerekir.

OpenClaw paketle gelen `claude-cli` arka ucunu kullanabilmeden önce, Claude Code'un kendisinin
aynı ana makinede zaten oturum açmış olması gerekir:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`agents.defaults.cliBackends.claude-cli.command` ayarını yalnızca `claude`
binary'si zaten `PATH` üzerinde değilse kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, id'nin birden fazla bayrağa eklenmesi gerektiğinde
  `sessionArg` (ör. `--session-id`) veya `sessionArgs` (placeholder `{sessionId}`) ayarlayın.
- CLI farklı bayraklara sahip bir **resume alt komutu** kullanıyorsa,
  `resumeArgs` (resume sırasında `args` yerine geçer) ve isteğe bağlı olarak `resumeOutput`
  (JSON olmayan resume'lar için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum id'si gönder (saklı yoksa yeni UUID).
  - `existing`: yalnızca daha önce saklanmışsa bir oturum id'si gönder.
  - `none`: hiçbir zaman oturum id'si gönderme.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve
  `input: "stdin"` kullanır; böylece takip turları etkin olduğu sürece canlı Claude sürecini yeniden kullanır.
  Sıcak stdio artık, taşıma alanlarını atlayan özel config'ler dahil, varsayılandır.
  Gateway yeniden başlatılırsa veya boşta duran süreç çıkarsa,
  OpenClaw saklanan Claude oturum id'sinden resume eder. Saklı oturum
  id'leri, resume öncesinde var olan okunabilir bir proje transcript'ine karşı doğrulanır;
  böylece hayalet bağlamalar, `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine
  `reason=transcript-missing` ile temizlenir.
- Claude canlı oturumları sınırlı JSONL çıktı korumalarını tutar. Varsayılanlar tur başına
  8 MiB ve 20.000 ham JSONL satırına kadar izin verir. Araç yoğun Claude turları, bunları arka uç başına
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  ve `maxTurnLines` ile yükseltebilir; OpenClaw bu ayarları 64 MiB ve 100.000
  satırla sınırlar.
- Saklı CLI oturumları sağlayıcıya ait sürekliliktir. Örtük günlük oturum
  sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` ilkeleri yine de
  keser.

Serileştirme notları:

- `serialize: true` aynı hat çalıştırmalarını sıralı tutar.
- Çoğu CLI tek bir sağlayıcı hattında serileştirir.
- Seçili auth kimliği değiştiğinde OpenClaw saklı CLI oturumu yeniden kullanımını bırakır;
  buna değişen auth profile id'si, statik API anahtarı, statik token veya CLI bir tane sunuyorsa OAuth
  hesap kimliği dahildir. OAuth erişim ve yenileme token'ı rotasyonu saklı CLI oturumunu
  kesmez. Bir CLI kararlı bir OAuth hesap id'si sunmuyorsa, OpenClaw o CLI'nin resume izinlerini
  uygulamasına izin verir.

## claude-cli oturumlarından fallback başlangıcı

Bir `claude-cli` denemesi, [`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki
CLI olmayan bir adaya geçerse, OpenClaw bir sonraki denemeyi
`~/.claude/projects/` içindeki Claude Code'un yerel JSONL transcript'inden toplanan bağlam başlangıcıyla besler.
Bu seed olmadan, OpenClaw'ın kendi oturum transcript'i `claude-cli` çalışmaları için boş olduğundan
fallback sağlayıcısı soğuk başlardı.

- Başlangıç, en son `/compact` özetini veya `compact_boundary`
  işaretçisini tercih eder, ardından karakter bütçesine kadar en son sınır sonrası turları ekler.
  Sınır öncesi turlar atılır çünkü özet zaten onları temsil eder.
- Araç blokları, prompt bütçesini dürüst tutmak için kompakt `(tool call: name)` ve
  `(tool result: …)` ipuçlarına birleştirilir. Özet taşarsa
  `(truncated)` olarak etiketlenir.
- Aynı sağlayıcı `claude-cli` -> `claude-cli` fallback'leri Claude'un kendi
  `--resume` mekanizmasına dayanır ve başlangıcı atlar.
- Seed, mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; bu nedenle
  rastgele yollar okunamaz.

## Görüntüler (geçirme)

CLI'niz görüntü yollarını kabul ediyorsa, `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlıysa, bu
yollar CLI arg'ları olarak geçirilir. `imageArg` eksikse, OpenClaw dosya yollarını
prompt'a ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları otomatik yükleyen CLI'ler için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan) JSON ayrıştırmayı ve metin + oturum id'si çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` içinden,
  kullanımı ise `stats` içinden okur.
- `output: "jsonl"` JSONL akışlarını (örneğin Codex CLI `--json`) ayrıştırır ve varsa son agent mesajı ile oturum
  tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u son yanıt olarak ele alır.

Girdi modları:

- `input: "arg"` (varsayılan) prompt'u son CLI arg'ı olarak geçirir.
- `input: "stdin"` prompt'u stdin üzerinden gönderir.
- Prompt çok uzunsa ve `maxPromptArgChars` ayarlıysa, stdin kullanılır.

## Varsayılanlar (plugin'e ait)

Paketle gelen OpenAI plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketle gelen Google plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

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
- `usage` yoksa veya boşsa kullanım bilgisi `stats` değerine geri döner.
- `stats.cached`, OpenClaw `cacheRead` değerine normalleştirilir.
- `stats.input` eksikse OpenClaw giriş tokenlerini
  `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka uç varsayılanları artık plugin yüzeyinin bir parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model başvurularında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` hook'u üzerinden plugin'e ait kalır.

Küçük prompt/ileti uyumluluk shim'lerine ihtiyaç duyan Plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden
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

`input`, CLI'ye iletilen sistem prompt'unu ve kullanıcı prompt'unu yeniden yazar. `output`,
OpenClaw kendi denetim işaretçilerini ve kanal teslimini işlemeden önce akışlı asistan deltalarını ve ayrıştırılmış son metni
yeniden yazar.

Claude Code stream-json uyumlu JSONL yayan CLI'ler için bu arka ucun yapılandırmasında
`jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz, ancak bir arka uç
`bundleMcp: true` ile üretilmiş bir MCP yapılandırma katmanına dahil olmayı seçebilir.

Geçerli paket davranışı:

- `claude-cli`: üretilmiş katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları; üretilmiş
  OpenClaw loopback sunucusu, Codex'in sunucu başına araç onay modu ile işaretlenir;
  böylece MCP çağrıları yerel onay prompt'larında takılamaz
- `google-gemini-cli`: üretilmiş Gemini sistem ayarları dosyası

bundle MCP etkinleştirildiğinde OpenClaw:

- Gateway araçlarını CLI işlemine sunan bir loopback HTTP MCP sunucusu başlatır
- köprüyü oturum başına bir token (`OPENCLAW_MCP_TOKEN`) ile kimlik doğrular
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırması/ayarları biçimiyle birleştirir
- başlatma yapılandırmasını, sahip olan extension'dan gelen arka uca ait entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse, bir arka uç bundle MCP'ye dahil olmayı seçtiğinde OpenClaw yine de
arka plan çalıştırmalarının yalıtılmış kalması için katı bir yapılandırma enjekte eder.

Oturum kapsamlı paket MCP çalışma zamanları, bir oturum içinde yeniden kullanım için önbelleğe alınır, ardından
`mcp.sessionIdleTtlMs` milisaniye boşta kalma süresinden sonra temizlenir (varsayılan 10
dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama yoklamaları,
slug üretimi ve active-memory hatırlama isteği gibi tek seferlik gömülü çalıştırmalar, stdio
alt işlemlerinin ve Streamable HTTP/SSE akışlarının çalıştırmadan uzun yaşamaması için çalıştırma sonunda temizlenir.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yok.** OpenClaw, CLI arka uç protokolüne araç çağrıları enjekte etmez.
  Arka uçlar Gateway araçlarını yalnızca
  `bundleMcp: true` seçtiklerinde görür.
- **Akış arka uca özgüdür.** Bazı arka uçlar JSONL akışı yapar; diğerleri çıkışa kadar
  tamponlar.
- **Yapılandırılmış çıktılar** CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden sürdürülür (JSONL yoktur); bu, ilk
  `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw oturumları yine de
  normal şekilde çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI model eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlandığından ve `sessionMode` değerinin
  `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla sürdüremez).
- **Görseller yok sayıldı**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
