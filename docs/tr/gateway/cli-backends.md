---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir geri dönüş seçeneği istersiniz
    - Codex CLI veya diğer yerel yapay zeka CLI'larını çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel yapay zeka CLI yedeği'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-05-04T18:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları devre dışı kaldığında,
hız sınırına takıldığında veya geçici olarak hatalı davrandığında **yerel AI CLI'larını** **yalnızca metin yedeği** olarak çalıştırabilir. Bu bilinçli olarak temkinli tasarlanmıştır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan arka uçlar
  loopback MCP köprüsü üzerinden gateway araçlarını alabilir.
- Destekleyen CLI'lar için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip eden turlar tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler geçirilebilir**.

Bu, birincil yol olmaktan ziyade bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere
bağımlı olmadan “her zaman çalışır” metin yanıtları istediğinizde kullanın.

ACP oturum denetimleri, arka plan görevleri,
iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları olan tam bir çalışma zamanı altyapısı istiyorsanız bunun yerine
[ACP Aracıları](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Yeni başlayanlara uygun hızlı başlangıç

Codex CLI'ı **hiç yapılandırma olmadan** kullanabilirsiniz (paketle gelen OpenAI Plugin'i
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway'iniz launchd/systemd altında çalışıyorsa ve PATH en düşük düzeydeyse yalnızca
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

Hepsi bu. CLI'ın kendisi dışında anahtar veya ek kimlik doğrulama yapılandırması gerekmez.

Bir Gateway ana makinesinde paketle gelen bir CLI arka ucunu **birincil ileti sağlayıcısı** olarak kullanıyorsanız, yapılandırmanız
bu arka uca bir model başvurusunda veya
`agents.defaults.cliBackends` altında açıkça referans verdiğinde OpenClaw artık sahip olan paketli Plugin'i otomatik olarak yükler.

## Yedek olarak kullanma

Bir CLI arka ucunu yedek listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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
  sırada CLI arka ucunu dener.

## Yapılandırmaya genel bakış

Tüm CLI arka uçları şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **sağlayıcı kimliği** ile anahtarlanır (örn. `codex-cli`, `my-cli`).
Sağlayıcı kimliği model başvurunuzun sol tarafı olur:

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

## Nasıl çalışır?

1. Sağlayıcı önekine (`codex-cli/...`) göre **bir arka uç seçer**.
2. Aynı OpenClaw istemi ve çalışma alanı bağlamını kullanarak **bir sistem istemi oluşturur**.
3. Geçmişin tutarlı kalması için CLI'ı bir oturum kimliğiyle (destekleniyorsa) **çalıştırır**.
   Paketle gelen `claude-cli` arka ucu, her OpenClaw oturumu için bir Claude stdio sürecini canlı tutar
   ve takip turlarını stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve nihai metni döndürür.
5. Takip turlarının aynı CLI oturumunu yeniden kullanabilmesi için arka uç başına **oturum kimliklerini kalıcılaştırır**.

<Note>
Paketle gelen Anthropic `claude-cli` arka ucu yeniden destekleniyor. Anthropic personeli,
OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize söyledi; bu nedenle OpenClaw,
Anthropic yeni bir politika yayımlamadıkça bu entegrasyon için `claude -p` kullanımını onaylı kabul eder.
</Note>

Paketle gelen OpenAI `codex-cli` arka ucu, OpenClaw'ın sistem istemini Codex'in
`model_instructions_file` yapılandırma geçersiz kılması üzerinden geçirir (`-c
model_instructions_file="..."`). Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmaz; bu nedenle OpenClaw, her yeni Codex CLI oturumu için birleştirilen istemi
geçici bir dosyaya yazar.

Paketle gelen Anthropic `claude-cli` arka ucu, OpenClaw skills anlık görüntüsünü
iki şekilde alır: eklenen sistem istemindeki kompakt OpenClaw skills kataloğu ve
`--plugin-dir` ile geçirilen geçici bir Claude Code Plugin'i. Plugin yalnızca
o aracı/oturum için uygun Skills öğelerini içerir; böylece Claude Code'un yerel skill
çözümleyicisi, OpenClaw'ın aksi halde istemde duyuracağı aynı filtrelenmiş kümeyi görür.
Skill env/API anahtarı geçersiz kılmaları, çalıştırma için OpenClaw tarafından
alt süreç ortamına yine uygulanır.

Claude CLI'ın kendi etkileşimsiz izin modu da vardır. OpenClaw bunu
Claude'a özgü yapılandırma eklemek yerine mevcut exec politikasına eşler: etkili istenen exec politikası YOLO olduğunda (`tools.exec.security: "full"` ve
`tools.exec.ask: "off"`), OpenClaw `--permission-mode bypassPermissions` ekler.
Aracı başına `agents.list[].tools.exec` ayarları, o aracı için genel `tools.exec` ayarlarını geçersiz kılar.
Farklı bir Claude modunu zorlamak için `agents.defaults.cliBackends.claude-cli.args` altında
`--permission-mode default` veya `--permission-mode acceptEdits` gibi açık ham arka uç argümanları ve eşleşen `resumeArgs` ayarlayın.

Paketle gelen Anthropic `claude-cli` arka ucu ayrıca OpenClaw `/think` düzeylerini,
kapalı olmayan düzeyler için Claude Code'un yerel `--effort` bayrağına eşler. `minimal` ve
`low`, `low` değerine; `adaptive` ve `medium`, `medium` değerine; `high`,
`xhigh` ve `max` ise doğrudan eşlenir. Diğer CLI arka uçlarının, `/think` oluşturulan CLI'ı etkileyebilmeden önce
sahip Plugin'lerinin eşdeğer bir argv eşleyici bildirmesi gerekir.

OpenClaw paketle gelen `claude-cli` arka ucunu kullanmadan önce, Claude Code'un kendisi
aynı ana makinede zaten oturum açmış olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`agents.defaults.cliBackends.claude-cli.command` ayarını yalnızca `claude`
ikilisi zaten `PATH` üzerinde değilse kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, kimliğin birden fazla bayrağa eklenmesi gerektiğinde
  `sessionArg` (örn. `--session-id`) veya `sessionArgs` (yer tutucu `{sessionId}`) ayarlayın.
- CLI farklı bayraklara sahip bir **resume alt komutu** kullanıyorsa
  `resumeArgs` (`args` yerine geçer) ve isteğe bağlı olarak `resumeOutput`
  (JSON olmayan resume işlemleri için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (kayıtlı yoksa yeni UUID).
  - `existing`: yalnızca önceden kayıtlı bir oturum kimliği varsa gönderir.
  - `none`: hiçbir zaman oturum kimliği göndermez.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve
  `input: "stdin"` kullanır; böylece takip turları aktifken canlı Claude sürecini yeniden kullanır.
  Sıcak stdio artık, taşıma alanlarını atlayan özel yapılandırmalar dahil, varsayılandır.
  Gateway yeniden başlatılırsa veya boşta olan süreç çıkarsa,
  OpenClaw kayıtlı Claude oturum kimliğinden sürdürür. Kayıtlı oturum
  kimlikleri, resume işleminden önce mevcut okunabilir bir proje transkriptiyle doğrulanır; böylece hayalet bağlamalar,
  `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine
  `reason=transcript-missing` ile temizlenir.
- Claude canlı oturumları sınırlı JSONL çıktı korumaları tutar. Varsayılanlar,
  tur başına 8 MiB'ye ve 20.000 ham JSONL satırına kadar izin verir. Araç yoğun Claude turları bunları arka uç başına
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  ve `maxTurnLines` ile artırabilir; OpenClaw bu ayarları 64 MiB ve 100.000
  satırla sınırlar.
- Kayıtlı CLI oturumları sağlayıcıya ait sürekliliktir. Örtük günlük oturum
  sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` politikaları yine
  keser.

Serileştirme notları:

- `serialize: true` aynı hat çalıştırmalarını sıralı tutar.
- Çoğu CLI tek bir sağlayıcı hattında serileştirir.
- Seçili kimlik doğrulama kimliği değiştiğinde OpenClaw kayıtlı CLI oturumu yeniden kullanımını bırakır;
  buna değişen kimlik doğrulama profili kimliği, statik API anahtarı, statik token veya CLI birini açığa çıkarıyorsa OAuth
  hesap kimliği dahildir. OAuth erişim ve yenileme token rotasyonu,
  kayıtlı CLI oturumunu kesmez. Bir CLI kararlı bir OAuth hesap kimliği açığa çıkarmıyorsa,
  OpenClaw resume izinlerini o CLI'ın uygulamasına bırakır.

## claude-cli oturumlarından yedek başlangıç metni

Bir `claude-cli` denemesi
[`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki CLI olmayan bir adaya devredildiğinde, OpenClaw
sonraki denemeyi Claude Code'un `~/.claude/projects/` içindeki yerel
JSONL transkriptinden derlenen bir bağlam başlangıç metniyle tohumlar. Bu tohum olmadan,
OpenClaw'ın kendi oturum transkripti `claude-cli` çalıştırmaları için boş olduğundan yedek
sağlayıcı soğuk başlardı.

- Başlangıç metni en son `/compact` özetini veya `compact_boundary`
  işaretleyicisini tercih eder, ardından en son sınır sonrası turları karakter
  bütçesine kadar ekler. Sınır öncesi turlar, özet zaten onları temsil ettiği için
  düşürülür.
- Araç blokları, istem bütçesini dürüst tutmak için kompakt `(tool call: name)` ve
  `(tool result: …)` ipuçlarında birleştirilir. Özet taşarsa
  `(truncated)` olarak etiketlenir.
- Aynı sağlayıcı `claude-cli` -> `claude-cli` yedekleri, Claude'un kendi
  `--resume` mekanizmasına dayanır ve başlangıç metnini atlar.
- Tohum, mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; bu nedenle
  rastgele yollar okunamaz.

## Görüntüler (geçirme)

CLI'ınız görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlıysa bu
yollar CLI argümanları olarak geçirilir. `imageArg` eksikse OpenClaw
dosya yollarını isteme ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları otomatik yükleyen CLI'lar için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan) JSON ayrıştırmayı ve metin + oturum kimliği çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw yanıt metnini `response` içinden,
  kullanım bilgisini ise `usage` eksik veya boş olduğunda `stats` içinden okur.
- `output: "jsonl"` JSONL akışlarını (örneğin Codex CLI `--json`) ayrıştırır ve varsa nihai aracı iletisini ve oturum
  tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u nihai yanıt olarak ele alır.

Giriş modları:

- `input: "arg"` (varsayılan) istemi son CLI argümanı olarak geçirir.
- `input: "stdin"` istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlıysa stdin kullanılır.

## Varsayılanlar (Plugin'e ait)

Paketle gelen OpenAI Plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketle gelen Google Plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

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
- `usage` yoksa veya boşsa, kullanım bilgisi `stats` alanına geri döner.
- `stats.cached`, OpenClaw `cacheRead` biçimine normalize edilir.
- `stats.input` eksikse, OpenClaw giriş tokenlerini
  `stats.input_tokens - stats.cached` değerinden türetir.

Yalnızca gerekiyorsa geçersiz kılın (yaygın: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka uç varsayılanları artık Plugin yüzeyinin parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model referanslarında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` hook'u üzerinden Plugin'e ait kalır.

Küçük prompt/mesaj uyumluluğu shim'lerine ihtiyaç duyan Plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden
çift yönlü metin dönüşümleri bildirebilir:

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
OpenClaw kendi denetim işaretçilerini ve kanal teslimini işlemeden önce
akışla gelen asistan deltalarını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json uyumlu JSONL üreten CLI'ler için, ilgili arka ucun yapılandırmasında
`jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP kaplamaları

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz, ancak bir arka uç
`bundleMcp: true` ile üretilmiş bir MCP yapılandırma kaplamasına dahil olmayı seçebilir.

Geçerli paketlenmiş davranış:

- `claude-cli`: üretilmiş katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları; üretilmiş
  OpenClaw loopback sunucusu, MCP çağrılarının yerel onay istemlerinde takılmaması için
  Codex'in sunucu başına araç onay modu ile işaretlenir
- `google-gemini-cli`: üretilmiş Gemini sistem ayarları dosyası

Bundle MCP etkinleştirildiğinde, OpenClaw:

- Gateway araçlarını CLI sürecine sunan bir loopback HTTP MCP sunucusu başlatır
- köprünün kimliğini oturum başına bir token (`OPENCLAW_MCP_TOKEN`) ile doğrular
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkinleştirilmiş bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırma/ayar şekliyle birleştirir
- başlatma yapılandırmasını, sahip uzantıdan gelen arka uca ait entegrasyon modunu kullanarak yeniden yazar

Etkin MCP sunucusu yoksa, bir arka uç bundle MCP'ye dahil olmayı seçtiğinde
OpenClaw yine de katı bir yapılandırma enjekte eder; böylece arka plan çalıştırmaları yalıtılmış kalır.

Oturum kapsamlı paketlenmiş MCP çalışma zamanları, bir oturum içinde yeniden kullanım için önbelleğe alınır, ardından
`mcp.sessionIdleTtlMs` milisaniyelik boşta kalma süresinden sonra temizlenir (varsayılan 10
dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama yoklamaları,
slug üretimi ve active-memory recall isteği gibi tek seferlik gömülü çalıştırmalar, stdio
alt süreçleri ve Streamable HTTP/SSE akışları çalıştırmadan daha uzun yaşamaması için çalıştırma sonunda temizlenir.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yok.** OpenClaw, araç çağrılarını
  CLI arka uç protokolüne enjekte etmez. Arka uçlar gateway araçlarını yalnızca
  `bundleMcp: true` ile dahil olduklarında görür.
- **Akış arka uca özgüdür.** Bazı arka uçlar JSONL akışı yapar; diğerleri
  çıkışa kadar arabelleğe alır.
- **Yapılandırılmış çıktılar** CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden sürdürülür (JSONL yoktur); bu,
  ilk `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw oturumları yine de
  normal çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` değerinin ayarlı olduğundan ve `sessionMode` değerinin
  `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla sürdürülemez).
- **Görseller yok sayılıyor**: `imageArg` değerini ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway çalıştırma kitabı](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
