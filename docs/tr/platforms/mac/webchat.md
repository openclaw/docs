---
read_when:
    - mac WebChat görünümünde veya loopback bağlantı noktasında hata ayıklama
summary: Mac uygulamasının Gateway WebChat’i nasıl gömdüğü ve bunun nasıl hata ayıklanacağı
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-05-06T09:22:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

macOS menü çubuğu uygulaması, WebChat arayüzünü yerel bir SwiftUI görünümü olarak gömer. Gateway'e bağlanır ve seçili agent için varsayılan olarak **ana oturumu** kullanır (diğer oturumlar için bir oturum değiştiriciyle).

- **Yerel mod**: doğrudan yerel Gateway WebSocket'ine bağlanır.
- **Uzak mod**: Gateway denetim bağlantı noktasını SSH üzerinden iletir ve bu tüneli veri düzlemi olarak kullanır.

## Başlatma ve hata ayıklama

- Manuel: Lobster menüsü → "Sohbeti Aç".
- Test için otomatik açma:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Günlükler: `./scripts/clawlog.sh` (alt sistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Nasıl bağlanır

- Veri düzlemi: Gateway WS yöntemleri `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` ve olaylar `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history`, görüntüleme için normalleştirilmiş transkript satırları döndürür: satır içi directive
  etiketleri görünür metinden çıkarılır, düz metin tool-call XML yükleri
  (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve
  sızmış ASCII/tam genişlikli model denetim token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi yalnızca
  sessiz-token içeren assistant satırları
  atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
- Oturum: varsayılan olarak birincil oturumu kullanır (`main` veya kapsam
  global olduğunda `global`). Arayüz oturumlar arasında geçiş yapabilir.
- Onboarding, ilk çalıştırma kurulumunu ayrı tutmak için özel bir oturum kullanır.

## Güvenlik yüzeyi

- Uzak mod, yalnızca Gateway WebSocket denetim bağlantı noktasını SSH üzerinden iletir.

## Bilinen sınırlamalar

- Arayüz, sohbet oturumları için optimize edilmiştir (tam bir tarayıcı sandbox'ı değildir).

## İlgili

- [WebChat](/tr/web/webchat)
- [macOS uygulaması](/tr/platforms/macos)
