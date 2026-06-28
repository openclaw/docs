---
read_when:
    - Sesli uyandırma sözcüklerinin davranışını veya varsayılanlarını değiştirme
    - Yeni node platformları ekleme; bunlar uyandırma sözcüğü eşitlemesi gerektirir
summary: Küresel sesli uyandırma sözcükleri (Gateway tarafından yönetilir) ve düğümler arasında nasıl eşitlendikleri
title: Sesle uyandırma
x-i18n:
    generated_at: "2026-06-28T00:47:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw, **uyandırma sözcüklerini Gateway'in sahip olduğu tek bir genel liste** olarak ele alır.

- **Düğüm başına özel uyandırma sözcüğü yoktur**.
- **Herhangi bir düğüm/uygulama kullanıcı arayüzü** listeyi düzenleyebilir; değişiklikler Gateway tarafından kalıcı hale getirilir ve herkese yayınlanır.
- macOS ve iOS yerel **Voice Wake etkin/devre dışı** anahtarlarını korur (yerel kullanıcı deneyimi + izinler farklıdır).
- Android şu anda Voice Wake özelliğini kapalı tutar ve Voice sekmesinde manuel mikrofon akışı kullanır.

## Depolama (Gateway ana makinesi)

Uyandırma sözcükleri ve yönlendirme kuralları Gateway durum veritabanında saklanır:

- `~/.openclaw/state/openclaw.sqlite`

Etkin tablolar şunlardır:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Eski `settings/voicewake.json` ve `settings/voicewake-routing.json` dosyaları
yalnızca doctor geçiş girdileridir; çalışma zamanı SQLite tablolarını okur ve yazar.

## Protokol

### Yöntemler

- `voicewake.get` → `{ triggers: string[] }`
- `{ triggers: string[] }` parametreleriyle `voicewake.set` → `{ triggers: string[] }`

Notlar:

- Tetikleyiciler normalleştirilir (kırpılır, boş olanlar atılır). Boş listeler varsayılanlara geri döner.
- Güvenlik için sınırlar uygulanır (sayı/uzunluk üst sınırları).

### Yönlendirme yöntemleri (tetikleyici → hedef)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `{ config: VoiceWakeRoutingConfig }` parametreleriyle `voicewake.routing.set` → `{ config: VoiceWakeRoutingConfig }`

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

- `voicewake.changed` yükü `{ triggers: string[] }`
- `voicewake.routing.changed` yükü `{ config: VoiceWakeRoutingConfig }`

Bunu kim alır:

- Tüm WebSocket istemcileri (macOS uygulaması, WebChat vb.)
- Tüm bağlı düğümler (iOS/Android) ve ayrıca düğüm bağlandığında ilk "geçerli durum" gönderimi olarak.

## İstemci davranışı

### macOS uygulaması

- `VoiceWakeRuntime` tetikleyicilerini denetlemek için genel listeyi kullanır.
- Voice Wake ayarlarındaki "Tetikleyici sözcükler" düzenlemesi `voicewake.set` çağrısı yapar ve ardından diğer istemcileri eşitlenmiş tutmak için yayına dayanır.

### iOS düğümü

- `VoiceWakeManager` tetikleyici algılaması için genel listeyi kullanır.
- Ayarlar'da Uyandırma Sözcükleri düzenlemesi `voicewake.set` çağrısı yapar (Gateway WS üzerinden) ve yerel uyandırma sözcüğü algılamasını da duyarlı tutar.

### Android düğümü

- Voice Wake şu anda Android çalışma zamanında/Ayarlar'da devre dışıdır.
- Android ses işlevi, uyandırma sözcüğü tetikleyicileri yerine Voice sekmesinde manuel mikrofon yakalama kullanır.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
