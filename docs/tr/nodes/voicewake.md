---
read_when:
    - Sesli uyandırma sözcükleri davranışını veya varsayılanlarını değiştirme
    - Uyandırma sözcüğü senkronizasyonuna ihtiyaç duyan yeni node platformları ekleme
summary: Genel sesli uyandırma sözcükleri (Gateway sahipliğinde) ve bunların node'lar arasında nasıl senkronize olduğu
title: Sesli uyandırma
x-i18n:
    generated_at: "2026-04-26T11:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw, **uyandırma sözcüklerini** **Gateway** tarafından sahiplenilen **tek bir genel liste** olarak ele alır.

- **Node başına özel uyandırma sözcüğü yoktur.**
- **Herhangi bir node/uygulama UI'ı** listeyi düzenleyebilir; değişiklikler Gateway tarafından kalıcılaştırılır ve herkese yayınlanır.
- macOS ve iOS, yerel **Voice Wake etkin/devre dışı** anahtarlarını korur (yerel UX + izinler farklıdır).
- Android şu anda Voice Wake özelliğini kapalı tutar ve Voice sekmesinde manuel mikrofon akışını kullanır.

## Depolama (Gateway ana makinesi)

Uyandırma sözcükleri gateway makinesinde şurada saklanır:

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

- Tetikleyiciler normalize edilir (baş/son boşluk kırpılır, boş değerler atılır). Boş listeler varsayılanlara fallback yapar.
- Güvenlik için sınırlar uygulanır (adet/uzunluk sınırları).

### Yönlendirme yöntemleri (tetikleyici → hedef)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` parametrelerle `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` biçimi:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Rota hedefleri tam olarak şunlardan birini destekler:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Olaylar

- `voicewake.changed` payload `{ triggers: string[] }`
- `voicewake.routing.changed` payload `{ config: VoiceWakeRoutingConfig }`

Bunu kim alır:

- Tüm WebSocket istemcileri (macOS uygulaması, WebChat vb.)
- Bağlı tüm node'lar (iOS/Android) ve ayrıca node bağlanırken başlangıçta bir “geçerli durum” gönderimi olarak.

## İstemci davranışı

### macOS uygulaması

- `VoiceWakeRuntime` tetikleyicilerini kapılamak için genel listeyi kullanır.
- Voice Wake ayarlarında “Trigger words” düzenlemek `voicewake.set` çağırır ve sonra diğer istemcileri senkron tutmak için yayına güvenir.

### iOS node

- `VoiceWakeManager` tetikleyici algılaması için genel listeyi kullanır.
- Settings içinde Wake Words düzenlemek `voicewake.set` çağırır (Gateway WS üzerinden) ve ayrıca yerel uyandırma sözcüğü algılamasını duyarlı tutar.

### Android node

- Voice Wake şu anda Android çalışma zamanında/Ayarlar'da devre dışıdır.
- Android sesi, uyandırma sözcüğü tetikleyicileri yerine Voice sekmesinde manuel mikrofon yakalamayı kullanır.

## İlgili

- [Talk mode](/tr/nodes/talk)
- [Audio and voice notes](/tr/nodes/audio)
- [Media understanding](/tr/nodes/media-understanding)
