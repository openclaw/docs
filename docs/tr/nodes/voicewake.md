---
read_when:
    - Sesle uyandırma sözcüklerinin davranışını veya varsayılanlarını değiştirme
    - Uyandırma sözcüğü eşitlemesi gerektiren yeni düğüm platformları ekleme
summary: Genel sesle uyandırma sözcükleri (Gateway sahipli) ve bunların düğümler arasında nasıl eşitlendiği
title: Sesle uyandırma
x-i18n:
    generated_at: "2026-04-24T09:18:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw, **uyandırma sözcüklerini** **Gateway** tarafından sahip olunan tek bir genel liste olarak ele alır.

- **Düğüm başına özel uyandırma sözcüğü yoktur**.
- **Herhangi bir düğüm/uygulama UI’si** listeyi düzenleyebilir; değişiklikler Gateway tarafından kalıcılaştırılır ve herkese yayınlanır.
- macOS ve iOS, yerel **Voice Wake etkin/devre dışı** anahtarlarını korur (yerel kullanıcı deneyimi + izinler farklıdır).
- Android şu anda Voice Wake’i kapalı tutar ve Voice sekmesinde elle mikrofon akışı kullanır.

## Depolama (Gateway ana makinesi)

Uyandırma sözcükleri Gateway makinesinde şu konumda saklanır:

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

- `voicewake.changed` yükü `{ triggers: string[] }`

Kim alır:

- Tüm WebSocket istemcileri (macOS uygulaması, WebChat vb.)
- Tüm bağlı düğümler (iOS/Android) ve ayrıca düğüm bağlanırken ilk “geçerli durum” itmesi olarak

## İstemci davranışı

### macOS uygulaması

- `VoiceWakeRuntime` tetikleyicilerini geçitlemek için genel listeyi kullanır.
- Voice Wake ayarlarındaki “Trigger words” düzenlemesi `voicewake.set` çağırır ve ardından diğer istemcileri eşzamanlı tutmak için yayına güvenir.

### iOS düğümü

- `VoiceWakeManager` tetikleyici algılaması için genel listeyi kullanır.
- Ayarlarda Wake Words düzenlemesi `voicewake.set` çağırır (Gateway WS üzerinden) ve ayrıca yerel uyandırma sözcüğü algılamasını duyarlı tutar.

### Android düğümü

- Voice Wake şu anda Android çalışma zamanı/Ayarlarda devre dışıdır.
- Android sesi, uyandırma sözcüğü tetikleyicileri yerine Voice sekmesinde elle mikrofon yakalama kullanır.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
