---
read_when:
    - Agent çalışma zamanını, çalışma alanı önyüklemesini veya oturum davranışını değiştiriyorsunuz
summary: Agent çalışma zamanı, çalışma alanı sözleşmesi ve oturum önyüklemesi
title: Agent Runtime
x-i18n:
    generated_at: "2026-04-05T13:50:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# Agent Runtime

OpenClaw tek bir gömülü agent çalışma zamanı çalıştırır.

## Çalışma alanı (gerekli)

OpenClaw, araçlar ve bağlam için agent'ın **tek** çalışma dizini (`cwd`) olarak tek bir agent çalışma alanı dizini (`agents.defaults.workspace`) kullanır.

Önerilen: `~/.openclaw/openclaw.json` eksikse oluşturmak ve çalışma alanı dosyalarını başlatmak için `openclaw setup` kullanın.

Tam çalışma alanı düzeni + yedekleme kılavuzu: [Agent workspace](/concepts/agent-workspace)

`agents.defaults.sandbox` etkinse, ana olmayan oturumlar bunu
`agents.defaults.sandbox.workspaceRoot` altındaki oturum başına çalışma alanlarıyla geçersiz kılabilir (bkz.
[Gateway configuration](/gateway/configuration)).

## Önyükleme dosyaları (enjekte edilir)

`agents.defaults.workspace` içinde OpenClaw şu kullanıcı tarafından düzenlenebilir dosyaları bekler:

- `AGENTS.md` — çalışma talimatları + “hafıza”
- `SOUL.md` — persona, sınırlar, ton
- `TOOLS.md` — kullanıcı tarafından tutulan araç notları (ör. `imsg`, `sag`, kurallar)
- `BOOTSTRAP.md` — ilk çalıştırmaya özel ritüel (tamamlandıktan sonra silinir)
- `IDENTITY.md` — agent adı/havası/emoji
- `USER.md` — kullanıcı profili + tercih edilen hitap biçimi

Yeni bir oturumun ilk dönüşünde OpenClaw, bu dosyaların içeriklerini doğrudan agent bağlamına enjekte eder.

Boş dosyalar atlanır. Büyük dosyalar, istemlerin sade kalması için bir işaretleyiciyle kırpılır ve kesilir (tam içerik için dosyayı okuyun).

Bir dosya eksikse OpenClaw tek bir “eksik dosya” işaretleyici satırı enjekte eder (ve `openclaw setup` güvenli bir varsayılan şablon oluşturur).

`BOOTSTRAP.md` yalnızca **tamamen yeni bir çalışma alanı** için oluşturulur (başka önyükleme dosyası yoksa). Ritüeli tamamladıktan sonra silerseniz, sonraki yeniden başlatmalarda yeniden oluşturulmamalıdır.

Önyükleme dosyası oluşturmayı tamamen devre dışı bırakmak için (önceden tohumlanmış çalışma alanları için) şunu ayarlayın:

```json5
{ agent: { skipBootstrap: true } }
```

## Yerleşik araçlar

Temel araçlar (read/exec/edit/write ve ilgili sistem araçları) araç ilkesine bağlı olarak her zaman kullanılabilir durumdadır. `apply_patch` isteğe bağlıdır ve `tools.exec.applyPatch` tarafından denetlenir. `TOOLS.md`, hangi araçların var olduğunu kontrol etmez; bunları nasıl kullanmak _istediğinize_ dair rehberlik sağlar.

## Skills

OpenClaw, Skills öğelerini şu konumlardan yükler (en yüksek öncelik önce):

- Çalışma alanı: `<workspace>/skills`
- Proje agent Skills: `<workspace>/.agents/skills`
- Kişisel agent Skills: `~/.agents/skills`
- Yönetilen/yerel: `~/.openclaw/skills`
- Paketlenmiş (kurulumla birlikte gelir)
- Ek Skill klasörleri: `skills.load.extraDirs`

Skills config/env ile denetlenebilir (bkz. [Gateway configuration](/gateway/configuration) içindeki `skills`).

## Çalışma zamanı sınırları

Gömülü agent çalışma zamanı, Pi agent çekirdeği (modeller, araçlar ve
istem hattı) üzerine kuruludur. Oturum yönetimi, keşif, araç bağlama ve kanal
teslimi, bu çekirdeğin üzerine eklenmiş OpenClaw'a ait katmanlardır.

## Oturumlar

Oturum dökümleri JSONL olarak şu konumda saklanır:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Oturum kimliği kararlıdır ve OpenClaw tarafından seçilir.
Diğer araçlardan kalan eski oturum klasörleri okunmaz.

## Akış sürerken yönlendirme

Kuyruk modu `steer` olduğunda, gelen mesajlar mevcut çalıştırmaya enjekte edilir.
Kuyruğa alınan yönlendirme, **mevcut assistant dönüşü araç çağrılarını yürütmeyi tamamladıktan sonra**, bir sonraki LLM çağrısından önce teslim edilir. Yönlendirme artık mevcut assistant mesajından kalan araç çağrılarını atlamaz; bunun yerine kuyruğa alınan mesajı bir sonraki model sınırında enjekte eder.

Kuyruk modu `followup` veya `collect` olduğunda, gelen mesajlar mevcut
dönüş bitene kadar tutulur, ardından kuyruğa alınan yüklerle yeni bir
agent dönüşü başlar. Mod + debounce/cap davranışı için bkz.
[Queue](/concepts/queue).

Blok akışı, tamamlanan assistant bloklarını biter bitmez gönderir; varsayılan olarak
**kapalıdır** (`agents.defaults.blockStreamingDefault: "off"`).
Sınırı `agents.defaults.blockStreamingBreak` ile ayarlayın (`text_end` veya `message_end`; varsayılan `text_end`).
Yumuşak blok parçalamayı `agents.defaults.blockStreamingChunk` ile kontrol edin (varsayılan
800–1200 karakter; önce paragraf sonlarını, sonra yeni satırları, en son cümleleri tercih eder).
Tek satırlık spam'i azaltmak için akışla gönderilen parçaları `agents.defaults.blockStreamingCoalesce` ile birleştirin
(göndermeden önce boşta kalma süresine göre birleştirme). Telegram dışındaki kanallar,
blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
Ayrıntılı araç özetleri araç başlangıcında yayımlanır (debounce yok); Control UI,
mümkün olduğunda agent olayları üzerinden araç çıktısını akıtır.
Daha fazla ayrıntı: [Streaming + chunking](/concepts/streaming).

## Model başvuruları

Config içindeki model başvuruları (örneğin `agents.defaults.model` ve `agents.defaults.models`) **ilk** `/` karakterine göre bölünerek ayrıştırılır.

- Modelleri yapılandırırken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı belirtmezseniz OpenClaw önce bir takma adı, ardından tam model kimliği için benzersiz bir
  yapılandırılmış sağlayıcı eşleşmesini dener ve ancak ondan sonra
  yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık
  yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski kaldırılmış sağlayıcı varsayılanını
  göstermekte ısrar etmek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.

## Yapılandırma (asgari)

En azından şunları ayarlayın:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (kuvvetle önerilir)

---

_Sıradaki: [Group Chats](/tr/channels/group-messages)_ 🦞
