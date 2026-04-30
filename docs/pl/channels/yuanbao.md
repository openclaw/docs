---
read_when:
    - Chcesz połączyć bota Yuanbao
    - Konfigurujesz kanał Yuanbao
summary: Omówienie bota Yuanbao, funkcje i konfiguracja
title: Yuanbao
x-i18n:
    generated_at: "2026-04-30T09:40:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao to platforma asystenta AI firmy Tencent. Plugin kanału OpenClaw
łączy boty Yuanbao z OpenClaw przez WebSocket, aby mogły komunikować się z użytkownikami
za pomocą wiadomości bezpośrednich i czatów grupowych.

**Status:** gotowy do produkcji dla wiadomości bezpośrednich botów i czatów grupowych. WebSocket to jedyny obsługiwany tryb połączenia.

---

## Szybki start

> **Wymaga OpenClaw 2026.4.10 lub nowszego.** Uruchom `openclaw --version`, aby sprawdzić wersję. Zaktualizuj za pomocą `openclaw update`.

<Steps>
  <Step title="Dodaj kanał Yuanbao z własnymi poświadczeniami">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Wartość `--token` używa formatu `appKey:appSecret` rozdzielonego dwukropkiem. Możesz uzyskać te dane z aplikacji Yuanbao, tworząc robota w ustawieniach aplikacji.
  </Step>

  <Step title="Po zakończeniu konfiguracji uruchom ponownie Gateway, aby zastosować zmiany">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Konfiguracja interaktywna (alternatywa)

Możesz także użyć kreatora interaktywnego:

```bash
openclaw channels login --channel yuanbao
```

Postępuj zgodnie z instrukcjami, aby wprowadzić App ID i App Secret.

---

## Kontrola dostępu

### Wiadomości bezpośrednie

Skonfiguruj `dmPolicy`, aby kontrolować, kto może wysyłać wiadomości bezpośrednie do bota:

- `"pairing"` — nieznani użytkownicy otrzymują kod parowania; zatwierdź przez CLI
- `"allowlist"` — czatować mogą tylko użytkownicy wymienieni w `allowFrom`
- `"open"` — zezwól wszystkim użytkownikom (domyślnie)
- `"disabled"` — wyłącz wszystkie wiadomości bezpośrednie

**Zatwierdź prośbę o parowanie:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Czaty grupowe

**Wymóg wzmianki** (`channels.yuanbao.requireMention`):

- `true` — wymagaj @wzmianki (domyślnie)
- `false` — odpowiadaj bez @wzmianki

Odpowiedź na wiadomość bota w czacie grupowym jest traktowana jako domyślna wzmianka.

---

## Przykłady konfiguracji

### Podstawowa konfiguracja z otwartą polityką wiadomości bezpośrednich

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### Ogranicz wiadomości bezpośrednie do określonych użytkowników

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### Wyłącz wymóg @wzmianki w grupach

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Zoptymalizuj dostarczanie wiadomości wychodzących

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Dostrój strategię scalania tekstu

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Typowe polecenia

| Polecenie  | Opis                           |
| ---------- | ------------------------------ |
| `/help`    | Pokaż dostępne polecenia       |
| `/status`  | Pokaż status bota              |
| `/new`     | Rozpocznij nową sesję          |
| `/stop`    | Zatrzymaj bieżące uruchomienie |
| `/restart` | Uruchom ponownie OpenClaw      |
| `/compact` | Skompaktuj kontekst sesji      |

> Yuanbao obsługuje natywne menu poleceń ukośnikowych. Polecenia są automatycznie synchronizowane z platformą po uruchomieniu Gateway.

---

## Rozwiązywanie problemów

### Bot nie odpowiada w czatach grupowych

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że używasz @wzmianki o bocie (wymagane domyślnie)
3. Sprawdź logi: `openclaw logs --follow`

### Bot nie odbiera wiadomości

1. Upewnij się, że bot został utworzony i zatwierdzony w aplikacji Yuanbao
2. Upewnij się, że `appKey` i `appSecret` są poprawnie skonfigurowane
3. Upewnij się, że Gateway działa: `openclaw gateway status`
4. Sprawdź logi: `openclaw logs --follow`

### Bot wysyła puste lub zastępcze odpowiedzi

1. Sprawdź, czy model AI zwraca prawidłową treść
2. Domyślna odpowiedź zastępcza to: "暂时无法解答，你可以换个问题问问我哦"
3. Dostosuj ją przez `channels.yuanbao.fallbackReply`

### App Secret wyciekł

1. Zresetuj App Secret w YuanBao APP
2. Zaktualizuj wartość w swojej konfiguracji
3. Uruchom ponownie Gateway: `openclaw gateway restart`

---

## Konfiguracja zaawansowana

### Wiele kont

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kontroluje, które konto jest używane, gdy wychodzące interfejsy API nie określają `accountId`.

### Limity wiadomości

- `maxChars` — maksymalna liczba znaków w pojedynczej wiadomości (domyślnie: `3000` znaków)
- `mediaMaxMb` — limit przesyłania/pobierania multimediów (domyślnie: `20` MB)
- `overflowPolicy` — zachowanie, gdy wiadomość przekracza limit: `"split"` (domyślnie) lub `"stop"`

### Streaming

Yuanbao obsługuje wyjście strumieniowe na poziomie bloków. Gdy jest włączone, bot wysyła tekst fragmentami w trakcie generowania.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Ustaw `disableBlockStreaming: true`, aby wysłać pełną odpowiedź w jednej wiadomości.

### Kontekst historii czatu grupowego

Kontroluj, ile historycznych wiadomości jest uwzględnianych w kontekście AI dla czatów grupowych:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Tryb odpowiedzi do wiadomości

Kontroluj, jak bot cytuje wiadomości podczas odpowiadania w czatach grupowych:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Wartość   | Zachowanie                                                         |
| --------- | ------------------------------------------------------------------ |
| `"off"`   | Brak odpowiedzi z cytatem                                          |
| `"first"` | Cytuj tylko pierwszą odpowiedź na wiadomość przychodzącą (domyślnie) |
| `"all"`   | Cytuj każdą odpowiedź                                              |

### Wstrzykiwanie wskazówki Markdown

Domyślnie bot wstrzykuje instrukcje do promptu systemowego, aby zapobiec opakowywaniu całej odpowiedzi przez model AI w bloki kodu markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Tryb debugowania

Włącz niesanitowane dane wyjściowe logów dla określonych identyfikatorów botów:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Routing wielu agentów

Użyj `bindings`, aby kierować wiadomości bezpośrednie lub grupy Yuanbao do różnych agentów.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

Pola routingu:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (wiadomość bezpośrednia) lub `"group"` (czat grupowy)
- `match.peer.id`: identyfikator użytkownika lub kod grupy

---

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/pl/gateway/configuration)

| Ustawienie                                 | Opis                                                   | Domyślnie                              |
| ------------------------------------------ | ------------------------------------------------------ | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Włącz/wyłącz kanał                                     | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Domyślne konto dla routingu wychodzącego               | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (używany do podpisywania i generowania biletu) | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (używany do podpisywania)                   | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | Wstępnie podpisany token (pomija automatyczne podpisywanie biletu) | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | Wyświetlana nazwa konta                                | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Włącz/wyłącz określone konto                           | `true`                                 |
| `channels.yuanbao.dm.policy`               | Polityka wiadomości bezpośrednich                      | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Lista dozwolonych nadawców wiadomości bezpośrednich (lista identyfikatorów użytkowników) | —                                      |
| `channels.yuanbao.requireMention`          | Wymagaj @wzmianki w grupach                            | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Obsługa długich wiadomości (`split` lub `stop`)         | `split`                                |
| `channels.yuanbao.replyToMode`             | Strategia odpowiedzi do wiadomości w grupie (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Strategia wychodząca (`merge-text` lub `immediate`)     | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: minimalna liczba znaków wyzwalająca wysłanie | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: maksymalna liczba znaków na wiadomość       | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: limit bezczynności przed automatycznym opróżnieniem (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Limit rozmiaru multimediów (MB)                        | `20`                                   |
| `channels.yuanbao.historyLimit`            | Wpisy kontekstu historii czatu grupowego               | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Wyłącz wyjście strumieniowe na poziomie bloków          | `false`                                |
| `channels.yuanbao.fallbackReply`           | Odpowiedź zastępcza, gdy AI nie zwraca treści           | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Wstrzykuj instrukcje zapobiegające opakowywaniu markdown | `true`                                 |
| `channels.yuanbao.debugBotIds`             | Biała lista identyfikatorów botów do debugowania (niesanitowane logi) | `[]`                                   |

---

## Obsługiwane typy wiadomości

### Odbieranie

- ✅ Tekst
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio / głos
- ✅ Wideo
- ✅ Naklejki / niestandardowe emoji
- ✅ Elementy niestandardowe (karty linków itp.)

### Wysyłanie

- ✅ Tekst (z obsługą markdown)
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo
- ✅ Naklejki

### Wątki i odpowiedzi

- ✅ Odpowiedzi z cytatem (konfigurowalne przez `replyToMode`)
- ❌ Odpowiedzi w wątkach (nieobsługiwane przez platformę)

---

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
