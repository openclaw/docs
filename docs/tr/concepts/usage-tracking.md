---
read_when:
    - Sağlayıcı kullanım/kota yüzeylerini bağlıyorsunuz
    - Kullanım izleme davranışını veya kimlik doğrulama gereksinimlerini açıklamanız gerekiyor
summary: Kullanım izleme yüzeyleri ve kimlik bilgisi gereksinimleri
title: Kullanım takibi
x-i18n:
    generated_at: "2026-07-01T18:19:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Nedir?

- Sağlayıcı kullanımını/kotasını doğrudan kullanım uç noktalarından çeker.
- Tahmini maliyet yoktur; yalnızca sağlayıcının bildirdiği kota aralıkları veya hesap durumu
  özetleri vardır.
- İnsan tarafından okunabilir kota aralığı durumu çıktısı, üst API tüketilen kota, kalan kota
  veya yalnızca ham sayılar bildirse bile `X% left` biçimine normalize edilir. Sıfırlanabilir
  kota aralıkları olmayan sağlayıcılar bunun yerine bakiye gibi sağlayıcı özeti metni
  gösterebilir.
- Oturum düzeyi `/status` ve `session_status`, canlı oturum anlık görüntüsü seyrek olduğunda
  en son transcript kullanım girdisine geri dönebilir. Bu geri dönüş eksik token/cache
  sayaçlarını doldurur, etkin çalışma zamanı model etiketini kurtarabilir ve oturum
  metaverisi eksik veya daha küçük olduğunda daha büyük prompt odaklı toplamı tercih eder.
  Mevcut sıfır olmayan canlı değerler yine önceliklidir.

## Nerede görünür?

- Sohbetlerde `/status`: oturum token'ları + tahmini maliyet içeren emoji ağırlıklı durum kartı (yalnızca API anahtarı). Sağlayıcı kullanımı, mevcut olduğunda **geçerli model sağlayıcısı** için normalize edilmiş `X% left` aralığı veya sağlayıcı özeti metni olarak gösterilir.
- Sohbetlerde `/usage off|tokens|full`: yanıt başına kullanım alt bilgisi.
- Sohbetlerde `/usage cost`: OpenClaw oturum günlüklerinden toplanan yerel maliyet özeti.
- CLI: `openclaw status --usage` sağlayıcı başına tam döküm yazdırır.
- CLI: `openclaw channels list` aynı kullanım anlık görüntüsünü sağlayıcı yapılandırmasıyla birlikte yazdırır (atlamak için `--no-usage` kullanın).
- macOS menü çubuğu: Context altında "Usage" bölümü (yalnızca mevcutsa).

## Varsayılan kullanım alt bilgisi modu

`/usage off|tokens|full`, bir oturum için alt bilgiyi ayarlar ve bu oturum için
hatırlanır. `messages.responseUsage`, henüz seçim yapılmamış oturumlar için bu
modu başlatır; böylece alt bilgi her seferinde `/usage` yazmadan varsayılan
olarak açık olabilir.

Her kanal için tek bir mod veya `default` geri dönüşü olan kanal başına bir eşleme ayarlayın:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Üç ayrı oturum durumu

Bir oturumun `responseUsage` alanının temsil edilebilir üç durumu vardır ve her
birinin anlamı farklıdır:

| Durum                     | Saklanan değer                  | Etkin mod                                                               |
| ------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| **Ayarlanmamış / devral** | `undefined` (yok)               | `messages.responseUsage` yapılandırma varsayılanına, sonra `off` değerine düşer. |
| **Açıkça kapalı**         | `"off"` (saklanır)              | Her zaman kapalı — `off` olmayan yapılandırma varsayılanı alt bilgiyi yeniden etkinleştiremez. |
| **Açıkça açık**           | `"tokens"` veya `"full"` (saklanır) | Yapılandırma varsayılanından bağımsız olarak o mod.                     |

### Öncelik

Etkin mod = oturum geçersiz kılması → kanal yapılandırma girdisi → `default` → `off`.

Açık bir `/usage off`, oturumda gerçek `"off"` değeri olarak **kalıcılaştırılır**;
"ayarlanmamış" ile aynı değildir. Bu, `off` olmayan bir `messages.responseUsage`
varsayılanının, kullanıcı açıkça devre dışı bıraktıktan sonra alt bilgiyi yeniden
açamayacağı anlamına gelir.

### Sıfırlama ve kapatma

- `/usage off` — alt bilgiyi kapalı olmaya zorlar ve bu seçimi kalıcılaştırır.
  Yapılandırılmış `off` olmayan bir varsayılan bunu geçersiz kılamaz.
- `/usage reset` (takma adlar: `inherit`, `clear`, `default`) — oturum
  geçersiz kılmasını temizler. Oturum daha sonra etkin yapılandırma varsayılanını
  (`messages.responseUsage`) **devralır**. Hiç varsayılan yapılandırılmamışsa
  alt bilgi kapalıdır (önceki durumdan değişmez). Alt bilgiyi açıkça açmadan
  "varsayılana geri dönmek" için bunu kullanın.
- Tam oturum sıfırlaması (`/reset` veya `/new`) ya da oturum devri, kullanıcının
  görüntüleme seçiminin oturum devirlerinden sağ çıkması için açık kullanım modu
  tercihini **korur**. Yalnızca `/usage reset` (ve takma adları) geçersiz kılmayı
  gerçekten temizler.

### Geçiş davranışı

Argümansız `/usage` şu döngüyü izler: off → tokens → full → off. Döngünün
başlangıç noktası **etkin** geçerli moddur (ayarlanmamışsa yapılandırma
varsayılanına düşen oturum geçersiz kılması), bu nedenle döngü kullanıcının alt
bilgide gördüğüyle her zaman tutarlıdır.

### Yapılandırma

Yapılandırma yoksa önceki davranış korunur (alt bilgi `/usage` yazılana kadar
kapalı). Bir oturum geçersiz kılmasını temizleyip yapılandırılmış varsayılanı
yeniden devralmak için `/usage reset` kullanın.

## Özel `/usage full` alt bilgisi

`/usage full`, model, reasoning, hızlı/yavaş, context aralığı ve bu alanlar
mevcut olduğunda maliyet içeren yerleşik kompakt bir alt bilgi gösterir. Token
ve cache alanları özel şablonlar için kullanılabilir kalır. Şablon dosyası
gerekmez.

`messages.usageTemplate` yalnızca gelişmiş özel düzenler içindir. Değer bir
JSON dosya yolu (`~` desteklenir) veya satır içi bir nesnedir ve geçerli olduğunda
yerleşik alt bilginin yerini alır:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Eksik veya boş şablonlar sessizce yerleşik alt bilgiye geri döner. Okunamayan
veya geçersiz yapılandırılmış şablonlar da yerleşik alt bilgiye geri döner ve bir
operatör uyarısı üretir.

Özel şablonlara yerleşik şekilden başlayın, ardından değiştirmek istediğiniz
parçaları düzenleyin:

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
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Şekil

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

Her yüzey sıralı bir **parça** listesidir; motor her birini işler, boşları atar
ve kalanları `sep` ile birleştirir. Girdisi olmayan bir yüzey `output.default`
kullanır.

### Sözleşme Yolları

Bir parça değerleri, dönüş başına sözleşmeden noktalı yol ile okur. Eksik
değerler boştur (bu nedenle bir `when` koruması veya `|fallback` parçayı temiz
tutar).

| Yol                                                                                 | Anlam                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | kanal kimliği (`discord`/`telegram`/vb.) |
| `model.provider` / `model.display_name`                                             | sağlayıcı kimliği / model kimliği      |
| `model.reasoning`                                                                   | efor (`off` ile `xhigh` arası)         |
| `model.is_fallback` / `model.is_override`                                           | bool: geri dönüş kullanıldı / model sabitlendi |
| `state.fast_mode`                                                                   | bool: hızlı ve yavaş                   |
| `context.max_tokens` / `context.pct_used`                                           | aralık bütçesi / kullanılan 0-100      |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | dönüş toplamı                          |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | token görüntüleme korumaları ve cache yüzdesi |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | yalnızca son model çağrısı             |
| `cost.turn_usd`                                                                     | tahmini dönüş maliyeti                 |
| `identity.name` / `identity.emoji`                                                  | agent adı / seçilen emoji              |

(Sağlayıcı hız sınırı aralıkları bu sözleşmede **yoktur**.)

### Fiiller

Bir değeri soldan sağa fiillerden geçirin; fiil olmayan bölüm geri dönüştür.

| Fiil            | Etki                                  | Örnek                             |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | kompakt sayı                          | `272000 -> 272k`                  |
| `fixed:N`       | N ondalık (varsayılan 2)              | `0.0377`                          |
| `dur`           | saniyeden süreye                      | `14820 -> 4h07m`                  |
| `pct`           | `%` ekle                              | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | kullanılandan kalana              |
| `alias:TABLE`   | `aliases` içinde ara, listede yoksa aynen yazdır | `medium -> 🌗`                    |
| `meter:W:SCALE` | 0-100 değeri üzerinde W hücreli glif çubuğu | `[⣿⣿⠐⠐⠐]` (`meter:1` = tek glif) |

### Parça biçimleri

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolasyon.
- `{ "when": "<path>", "text": "..." }`: yalnızca yol truthy ise işle.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: değeri glife eşle.
- `{ "each": "limits.windows", "item": "{label}" }`: bir diziyi yinele.

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

- **Anthropic (Claude)**: auth profillerinde OAuth belirteçleri.
- **GitHub Copilot**: auth profillerinde OAuth belirteçleri.
- **Gemini CLI**: auth profillerinde OAuth belirteçleri.
  - JSON kullanımı `stats` değerine geri döner; `stats.cached`,
    `cacheRead` olarak normalleştirilir.
- **OpenAI Codex**: auth profillerinde OAuth belirteçleri (varsa accountId kullanılır).
- **MiniMax**: API anahtarı veya MiniMax OAuth auth profili. OpenClaw,
  `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota
  yüzeyi olarak ele alır, varsa depolanmış MiniMax OAuth'u tercih eder ve aksi
  halde `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY`
  değerlerine geri döner.
  Kullanım yoklaması, yapılandırıldığında Coding Plan ana bilgisayarını
  `models.providers.minimax-portal.baseUrl` veya `models.providers.minimax.baseUrl`
  değerinden türetir; aksi halde MiniMax CN ana bilgisayarını kullanır.
  MiniMax'in ham `usage_percent` / `usagePercent` alanları **kalan** kotayı
  ifade eder, bu yüzden OpenClaw bunları görüntülemeden önce tersine çevirir;
  varsa sayım tabanlı alanlar önceliklidir.
  - Coding-plan pencere etiketleri, varsa sağlayıcı saat/dakika alanlarından
    gelir; ardından `start_time` / `end_time` aralığına geri döner.
  - Coding-plan uç noktası `model_remains` döndürürse OpenClaw, chat-model
    girdisini tercih eder, açık `window_hours` / `window_minutes` alanları yoksa
    pencere etiketini zaman damgalarından türetir ve model adını plan etiketine
    dahil eder.
- **Xiaomi MiMo**: env/config/auth deposu üzerinden API anahtarı (`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth deposu üzerinden API anahtarı.
- **DeepSeek**: env/config/auth deposu üzerinden API anahtarı (`DEEPSEEK_API_KEY`).
  OpenClaw, DeepSeek'in bakiye uç noktasını çağırır ve sağlayıcının bildirdiği
  bakiyeyi, yüzde-kalan kota penceresi yerine metin olarak gösterir.

Kullanılabilir sağlayıcı kullanım auth bilgisi çözümlenemediğinde kullanım
gizlenir. Sağlayıcılar Plugin'e özgü kullanım auth mantığı sağlayabilir; aksi
halde OpenClaw, auth profillerinden, ortam değişkenlerinden veya yapılandırmadan
eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

## İlgili

- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
- [Prompt önbelleğe alma](/tr/reference/prompt-caching)
