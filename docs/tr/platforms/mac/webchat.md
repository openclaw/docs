---
read_when:
    - Mac WebChat görünümü veya loopback portunda hata ayıklarken
summary: Mac uygulamasının Gateway WebChat'i nasıl gömdüğü ve bunun nasıl hata ayıklanacağı
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat (macOS uygulaması)

macOS menü çubuğu uygulaması WebChat UI'sini yerel bir SwiftUI görünümü olarak gömer. Gateway'e bağlanır ve seçili aracı için varsayılan olarak **main session** kullanır (diğer oturumlar için bir oturum değiştirici ile).

- **Yerel mod**: doğrudan yerel Gateway WebSocket'e bağlanır.
- **Uzak mod**: Gateway kontrol portunu SSH üzerinden iletir ve bu
  tüneli veri düzlemi olarak kullanır.

## Başlatma ve hata ayıklama

- Manuel: Lobster menüsü → “Open Chat”.
- Test için otomatik açma:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Günlükler: `./scripts/clawlog.sh` (alt sistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Nasıl bağlandığı

- Veri düzlemi: Gateway WS yöntemleri `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` ve `chat`, `agent`, `presence`, `tick`, `health` olayları.
- `chat.history`, görüntüleme için normalize edilmiş transcript satırları döndürür: satır içi yönerge etiketleri görünür metinden kaldırılır, düz metin araç çağrısı XML yükleri
  (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve
  sızmış ASCII/tam genişlikte model kontrol belirteçleri kaldırılır, tam olarak
  `NO_REPLY` / `no_reply` olan saf sessiz-belirteç asistan satırları
  atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
- Oturum: varsayılan olarak birincil oturumu kullanır (`main` veya kapsam
  global olduğunda `global`). UI oturumlar arasında geçiş yapabilir.
- Onboarding, ilk çalıştırma kurulumunu ayrı tutmak için özel bir oturum kullanır.

## Güvenlik yüzeyi

- Uzak mod yalnızca Gateway WebSocket kontrol portunu SSH üzerinden iletir.

## Bilinen sınırlamalar

- UI, tam bir tarayıcı sandbox'ı için değil, sohbet oturumları için optimize edilmiştir.
