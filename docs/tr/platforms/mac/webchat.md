---
read_when:
    - macOS WebChat görünümünü veya local loopback portunu hata ayıklama
summary: mac uygulamasının Gateway WebChat'i nasıl gömdüğü ve bunun nasıl hata ayıklanacağı
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T09:20:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

macOS menü çubuğu uygulaması, WebChat arayüzünü yerel bir SwiftUI görünümü olarak gömer. Gateway'e bağlanır ve seçilen
agent için varsayılan olarak **ana oturumu** kullanır (diğer oturumlar için bir oturum değiştirici ile).

- **Yerel mod**: doğrudan yerel Gateway WebSocket'e bağlanır.
- **Uzak mod**: Gateway denetim portunu SSH üzerinden iletir ve bu
  tüneli veri düzlemi olarak kullanır.

## Başlatma ve hata ayıklama

- Elle: Lobster menüsü → “Open Chat”.
- Test için otomatik açma:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Günlükler: `./scripts/clawlog.sh` (alt sistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Nasıl bağlanır

- Veri düzlemi: Gateway WS yöntemleri `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` ve olaylar `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history`, görüntüleme için normalize edilmiş döküm satırları döndürür: satır içi directive
  etiketleri görünür metinden kaldırılır, düz metin araç çağrısı XML payload'ları
  (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil)
  ve sızmış ASCII/tam genişlikli model denetim token'ları kaldırılır, tam olarak
  `NO_REPLY` / `no_reply` olan yalnızca sessiz token'lı assistant satırları
  atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
- Oturum: varsayılan olarak birincil oturumdur (`main` veya kapsam
  global ise `global`). Arayüz oturumlar arasında geçiş yapabilir.
- Onboarding, ilk çalıştırma kurulumunu ayrı tutmak için özel bir oturum kullanır.

## Güvenlik yüzeyi

- Uzak mod, SSH üzerinden yalnızca Gateway WebSocket denetim portunu iletir.

## Bilinen sınırlamalar

- Arayüz, sohbet oturumları için optimize edilmiştir (tam tarayıcı sandbox'ı değildir).

## İlgili

- [WebChat](/tr/web/webchat)
- [macOS app](/tr/platforms/macos)
