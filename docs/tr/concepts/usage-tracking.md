---
read_when:
    - Sağlayıcı kullanım/kota yüzeylerini bağlıyorsunuz
    - Kullanım izleme davranışını veya kimlik doğrulama gereksinimlerini açıklamanız gerekir
summary: Kullanım izleme yüzeyleri ve kimlik bilgisi gereksinimleri
title: Kullanım takibi
x-i18n:
    generated_at: "2026-06-28T00:32:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Nedir

- Sağlayıcı kullanımını/kotasını doğrudan kullanım uç noktalarından çeker.
- Tahmini maliyet yoktur; yalnızca sağlayıcının bildirdiği kota pencereleri veya hesap durumu
  özetleri vardır.
- İnsan tarafından okunabilir kota penceresi durum çıktısı, yukarı akış API'si tüketilen kota,
  kalan kota veya yalnızca ham sayımlar bildirse bile `X% left` biçimine normalleştirilir.
  Sıfırlanabilir kota pencereleri olmayan sağlayıcılar bunun yerine bakiye gibi sağlayıcı özeti
  metni gösterebilir.
- Oturum düzeyi `/status` ve `session_status`, canlı oturum anlık görüntüsü seyrek olduğunda
  en son transcript kullanım girdisine geri dönebilir. Bu geri dönüş eksik token/önbellek
  sayaçlarını doldurur, etkin çalışma zamanı model etiketini kurtarabilir ve oturum
  meta verileri eksik veya daha küçük olduğunda daha büyük istem odaklı toplamı tercih eder.
  Mevcut sıfır olmayan canlı değerler yine önceliklidir.

## Nerede görünür

- Sohbetlerde `/status`: oturum token'ları + tahmini maliyet içeren emoji bakımından zengin durum kartı (yalnızca API anahtarı). Sağlayıcı kullanımı, mevcut olduğunda **geçerli model sağlayıcısı** için normalleştirilmiş `X% left` penceresi veya sağlayıcı özeti metni olarak gösterilir.
- Sohbetlerde `/usage off|tokens|full`: yanıt başına kullanım alt bilgisi (OAuth yalnızca token'ları gösterir).
- Sohbetlerde `/usage cost`: OpenClaw oturum günlüklerinden toplanan yerel maliyet özeti.
- CLI: `openclaw status --usage` sağlayıcı başına tam bir döküm yazdırır.
- CLI: `openclaw channels list` aynı kullanım anlık görüntüsünü sağlayıcı yapılandırmasının yanında yazdırır (atlamak için `--no-usage` kullanın).
- macOS menü çubuğu: Context altında "Kullanım" bölümü (yalnızca varsa).

## Varsayılan kullanım alt bilgisi modu

`/usage off|tokens|full` bir oturum için alt bilgiyi ayarlar ve bu, o oturum için hatırlanır.
`messages.responseUsage`, henüz seçim yapmamış oturumlar için bu modu başlangıç değeri yapar;
böylece her seferinde `/usage` yazmadan alt bilgi varsayılan olarak açık olabilir.

Her kanal için tek bir mod veya `default` geri dönüşlü kanal başına bir eşleme ayarlayın:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Üç ayrı oturum durumu

Bir oturumun `responseUsage` alanının temsil edilebilir üç durumu vardır ve her birinin
anlamı farklıdır:

| Durum                         | Saklanan değer                   | Etkili mod                                                                 |
| ----------------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| **Ayarlanmamış / devral**     | `undefined` (yok)                | `messages.responseUsage` yapılandırma varsayılanına, sonra `off` değerine düşer. |
| **Açıkça kapalı**             | `"off"` (saklanır)               | Her zaman kapalıdır — kapalı olmayan bir yapılandırma varsayılanı alt bilgiyi yeniden etkinleştiremez. |
| **Açıkça açık**               | `"tokens"` veya `"full"` (saklanır) | Yapılandırma varsayılanından bağımsız olarak bu mod.                       |

### Öncelik

Etkili mod = oturum geçersiz kılması → kanal yapılandırma girdisi → `default` → `off`.

Açık bir `/usage off`, oturumda gerçek değer `"off"` olarak **kalıcı hale getirilir**;
"ayarlanmamış" ile aynı değildir. Bu, kapalı olmayan bir `messages.responseUsage`
varsayılanının, kullanıcı açıkça devre dışı bıraktıktan sonra alt bilgiyi yeniden açamayacağı anlamına gelir.

### Sıfırlama ve kapatma

- `/usage off` — alt bilgiyi zorla kapatır ve bu seçimi kalıcı hale getirir. Yapılandırılmış
  kapalı olmayan bir varsayılan bunu geçersiz kılamaz.
- `/usage reset` (takma adlar: `inherit`, `clear`, `default`) — oturum
  geçersiz kılmasını temizler. Oturum daha sonra etkili yapılandırma varsayılanını
  (`messages.responseUsage`) **devralır**. Varsayılan yapılandırılmamışsa alt bilgi kapalıdır
  (öncekiyle değişmez). Bunu, alt bilgiyi açıkça açmadan "varsayılana geri dönmek" için kullanın.
- Tam oturum sıfırlaması (`/reset` veya `/new`) ya da oturum devri, kullanıcının görüntüleme
  seçiminin oturum devirlerinden sonra da kalması için açık kullanım modu tercihini **korur**.
  Yalnızca `/usage reset` (ve takma adları) geçersiz kılmayı gerçekten temizler.

### Geçiş davranışı

Argümansız `/usage` şu döngüde ilerler: off → tokens → full → off. Döngünün başlangıç noktası,
**etkili** geçerli moddur (ayarlanmamışsa oturum geçersiz kılması yapılandırma varsayılanına düşer);
bu nedenle döngü, kullanıcının alt bilgide gördüğüyle her zaman tutarlıdır.

### Yapılandırma

Yapılandırma yoksa önceki davranış korunur (alt bilgi `/usage` yazılana kadar kapalı).
Bir oturum geçersiz kılmasını temizlemek ve yapılandırılmış varsayılanı yeniden devralmak için
`/usage reset` kullanın.

## Özel `/usage full` alt bilgisi

`/usage full`, bu alanlar mevcut olduğunda model, reasoning, hızlı/yavaş,
bağlam penceresi, tur token'ları, önbellek ve maliyet içeren yerleşik kompakt bir alt bilgi gösterir.
Şablon dosyası gerekmez.

`messages.usageTemplate` yalnızca gelişmiş özel düzenler içindir. Değer bir JSON dosya yoludur
(`~` desteklenir) veya satır içi bir nesnedir ve geçerli olduğunda yerleşik alt bilginin yerini alır:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Eksik veya boş şablonlar sessizce yerleşik alt bilgiye geri döner. Okunamayan
veya geçersiz yapılandırılmış şablonlar da yerleşik alt bilgiye geri döner ve bir
operatör uyarısı yayar.

Özel şablonlara yerleşik biçimden başlayın, ardından değiştirmek istediğiniz bölümleri düzenleyin:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Biçim

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Her yüzey, sıralı bir **parçalar** listesidir; motor her birini işler, boşları atar
ve kalanları `sep` ile birleştirir. Girdisi olmayan bir yüzey `output.default` kullanır.

### Sözleşme Yolları

Bir parça değerleri tur başına sözleşmeden nokta yolu ile okur. Eksik değerler
boştur (böylece bir `when` koruması veya `|fallback` parçayı temiz tutar).

| Yol                                                                                 | Anlam                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | kanal kimliği (`discord`/`telegram`/vb.) |
| `model.provider` / `model.display_name`                                             | sağlayıcı kimliği / model kimliği      |
| `model.reasoning`                                                                   | efor (`off` ile `xhigh` arası)         |
| `model.is_fallback` / `model.is_override`                                           | bool: geri dönüş kullanıldı / model sabitlendi |
| `state.fast_mode`                                                                   | bool: hızlı ve yavaş                   |
| `context.max_tokens` / `context.pct_used`                                           | pencere bütçesi / 0-100 kullanıldı     |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | tur toplamı                            |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | token görüntüleme korumaları ve önbellek yüzdesi |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | yalnızca son model çağrısı             |
| `cost.turn_usd`                                                                     | tahmini tur maliyeti                   |
| `identity.name` / `identity.emoji`                                                  | ajan adı / seçilen emoji               |

(Sağlayıcı hız sınırı pencereleri bu sözleşmede **yoktur**.)

### Fiiller

Bir değeri fiillerden soldan sağa geçirin; fiil olmayan segment geri dönüş değeridir.

| Fiil            | Etki                                  | Örnek                             |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | kompakt sayı                          | `272000 -> 272k`                  |
| `fixed:N`       | N ondalık (varsayılan 2)              | `0.0377`                          |
| `dur`           | saniyeyi süreye çevirir               | `14820 -> 4h07m`                  |
| `pct`           | `%` ekler                             | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | kullanılandan kalana geçmek için  |
| `alias:TABLE`   | `aliases` içinde arama, listelenmemişse aynen döndür | `medium -> 🌗`                    |
| `meter:W:SCALE` | 0-100 değer üzerinde W hücreli glif çubuğu | `[⣿⣿⠐⠐⠐]` (`meter:1` = tek glif) |

### Parça biçimleri

- `{ "text": "📚 {context.max_tokens|num}" }`: sabit metin + interpolasyon.
- `{ "when": "<path>", "text": "..." }`: yalnızca yol truthy ise işle.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: değerden glife.
- `{ "each": "limits.windows", "item": "{label}" }`: bir dizi üzerinde yinele.

### Örnek

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

ör. `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` olarak işler.

## Sağlayıcılar + kimlik bilgileri

- **Anthropic (Claude)**: Kimlik doğrulama profillerinde OAuth belirteçleri.
- **GitHub Copilot**: Kimlik doğrulama profillerinde OAuth belirteçleri.
- **Gemini CLI**: Kimlik doğrulama profillerinde OAuth belirteçleri.
  - JSON kullanımı `stats` değerine geri döner; `stats.cached`,
    `cacheRead` olarak normalleştirilir.
- **OpenAI Codex**: Kimlik doğrulama profillerinde OAuth belirteçleri (varsa accountId kullanılır).
- **MiniMax**: API anahtarı veya MiniMax OAuth kimlik doğrulama profili. OpenClaw,
  `minimax`, `minimax-cn` ve `minimax-portal` öğelerini aynı MiniMax kota
  yüzeyi olarak ele alır, varsa depolanmış MiniMax OAuth'u tercih eder, aksi halde
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY`
  değerine geri döner.
  Kullanım yoklaması, yapılandırılmışsa Coding Plan ana makinesini `models.providers.minimax-portal.baseUrl`
  veya `models.providers.minimax.baseUrl` değerinden türetir; aksi halde
  MiniMax CN ana makinesini kullanır.
  MiniMax'in ham `usage_percent` / `usagePercent` alanları **kalan**
  kotayı ifade eder; bu nedenle OpenClaw bunları göstermeden önce tersine çevirir;
  mevcut olduğunda sayım tabanlı alanlar önceliklidir.
  - Kodlama planı pencere etiketleri, mevcut olduğunda sağlayıcının saat/dakika
    alanlarından gelir, ardından `start_time` / `end_time` aralığına geri döner.
  - Kodlama planı uç noktası `model_remains` döndürürse OpenClaw,
    sohbet modeli girdisini tercih eder, açık `window_hours` / `window_minutes`
    alanları yoksa pencere etiketini zaman damgalarından türetir ve plan
    etiketine model adını dahil eder.
- **Xiaomi MiMo**: env/config/auth deposu üzerinden API anahtarı (`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth deposu üzerinden API anahtarı.
- **DeepSeek**: env/config/auth deposu üzerinden API anahtarı (`DEEPSEEK_API_KEY`).
  OpenClaw, DeepSeek'in bakiye uç noktasını çağırır ve yüzde cinsinden kalan
  kota penceresi yerine sağlayıcının bildirdiği bakiyeyi metin olarak gösterir.

Kullanılabilir sağlayıcı kullanım kimlik doğrulaması çözümlenemediğinde kullanım gizlenir. Sağlayıcılar,
Plugin'e özgü kullanım kimlik doğrulama mantığı sağlayabilir; aksi halde OpenClaw,
kimlik doğrulama profillerinden, ortam değişkenlerinden veya yapılandırmadan
eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

## İlgili

- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
- [Prompt önbelleğe alma](/tr/reference/prompt-caching)
