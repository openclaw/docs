---
read_when:
    - Sesli uyandırma sözcüklerinin davranışını veya varsayılanlarını değiştirme
    - Uyandırma sözcüğü senkronizasyonuna ihtiyaç duyan yeni düğüm platformları ekleme
summary: Genel sesli uyandırma sözcükleri (Gateway'e ait) ve bunların düğümler arasında nasıl senkronize edildiği
title: Voice Wake
x-i18n:
    generated_at: "2026-04-05T13:59:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (Genel Uyandırma Sözcükleri)

OpenClaw, **uyandırma sözcüklerini Gateway'in sahip olduğu tek bir genel liste** olarak ele alır.

- **Düğüm başına özel uyandırma sözcükleri yoktur**.
- **Herhangi bir düğüm/uygulama UI'si** listeyi düzenleyebilir; değişiklikler Gateway tarafından kalıcılaştırılır ve herkese yayınlanır.
- macOS ve iOS, yerel **Voice Wake açık/kapalı** anahtarlarını korur (yerel UX + izinler farklıdır).
- Android şu anda Voice Wake özelliğini kapalı tutar ve Voice sekmesinde el ile mikrofon akışı kullanır.

## Depolama (Gateway ana makinesi)

Uyandırma sözcükleri gateway makinesinde şu konumda depolanır:

- `~/.openclaw/settings/voicewake.json`

Biçim:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokol

### Yöntemler

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` parametrelerle `{ triggers: string[] }` → `{ triggers: string[] }`

Notlar:

- Tetikleyiciler normalize edilir (kırpılır, boşlar atılır). Boş listeler varsayılanlara geri döner.
- Güvenlik için sınırlar uygulanır (sayı/uzunluk üst sınırları).

### Olaylar

- `voicewake.changed` payload'u `{ triggers: string[] }`

Bunu kim alır:

- Tüm WebSocket istemcileri (macOS uygulaması, WebChat vb.)
- Tüm bağlı düğümler (iOS/Android) ve ayrıca düğüm bağlandığında ilk “mevcut durum” iletimi olarak

## İstemci davranışı

### macOS uygulaması

- `VoiceWakeRuntime` tetikleyicilerini geçitlemek için genel listeyi kullanır.
- Voice Wake ayarlarında “Trigger words” düzenlendiğinde `voicewake.set` çağrılır ve ardından diğer istemcileri senkronize tutmak için yayına güvenilir.

### iOS düğümü

- `VoiceWakeManager` tetikleyici algılaması için genel listeyi kullanır.
- Ayarlar'da Wake Words düzenlendiğinde `voicewake.set` çağrılır (Gateway WS üzerinden) ve ayrıca yerel uyandırma sözcüğü algılaması da duyarlı tutulur.

### Android düğümü

- Voice Wake şu anda Android çalışma zamanı/Ayarlar içinde devre dışıdır.
- Android sesi, uyandırma sözcüğü tetikleyicileri yerine Voice sekmesinde el ile mikrofon yakalama kullanır.
