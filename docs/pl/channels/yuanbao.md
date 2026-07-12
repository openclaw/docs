---
read_when:
    - Chcesz połączyć bota Yuanbao
    - Konfigurujesz kanał Yuanbao
summary: Omówienie bota Yuanbao, funkcje i konfiguracja
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T14:56:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao to platforma asystenta AI firmy Tencent. Utrzymywana przez społeczność wtyczka `openclaw-plugin-yuanbao` łączy boty Yuanbao z OpenClaw przez WebSocket na potrzeby wiadomości bezpośrednich i czatów grupowych.

**Status:** gotowa do użytku produkcyjnego w przypadku wiadomości bezpośrednich do bota i czatów grupowych. WebSocket jest jedynym obsługiwanym trybem połączenia. Ta wtyczka jest utrzymywana przez zespół Tencent Yuanbao jako zewnętrzna pozycja katalogu, a nie przez główny projekt OpenClaw; poniższe szczegóły konfiguracji i działania (poza instalacją i ogólnym interfejsem CLI) pochodzą z dokumentacji samej wtyczki i nie zostały zweryfikowane względem kodu źródłowego głównego projektu OpenClaw.

## Szybki start

Wymaga OpenClaw 2026.4.10 lub nowszego. Sprawdź wersję za pomocą `openclaw --version`; zaktualizuj za pomocą `openclaw update`.

<Steps>
  <Step title="Dodaj kanał Yuanbao, podając swoje dane uwierzytelniające">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Opcja `--token` przyjmuje rozdzielone dwukropkiem wartości `appKey:appSecret`. Uzyskaj je z aplikacji Yuanbao, tworząc bota w ustawieniach swojej aplikacji.
  </Step>

  <Step title="Uruchom ponownie Gateway, aby zastosować zmianę">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Konfiguracja interaktywna (alternatywa)

```bash
openclaw channels login --channel yuanbao
```

Postępuj zgodnie z monitami, aby wprowadzić identyfikator aplikacji i sekret aplikacji.

## Kontrola dostępu

### Wiadomości bezpośrednie

`channels.yuanbao.dm.policy`:

| Wartość            | Działanie                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| `open` (domyślnie) | Zezwala wszystkim użytkownikom                                              |
| `pairing`          | Nieznani użytkownicy otrzymują kod parowania; zatwierdzenie odbywa się w CLI |
| `allowlist`        | Rozmawiać mogą tylko użytkownicy wymienieni w `allowFrom`                   |
| `disabled`         | Wyłącza wszystkie wiadomości bezpośrednie                                   |

Zatwierdź żądanie parowania:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Czaty grupowe

`channels.yuanbao.requireMention` (domyślnie `true`): wymaga wzmianki @ przed udzieleniem przez bota odpowiedzi w grupie. Odpowiedź na wiadomość samego bota jest traktowana jako niejawna wzmianka.

## Przykłady konfiguracji

Podstawowa konfiguracja z otwartą polityką wiadomości bezpośrednich:

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

Ograniczenie wiadomości bezpośrednich do określonych użytkowników:

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

Wyłączenie wymogu wzmianki @ w grupach:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Dostrajanie dostarczania wychodzącego:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buforuj do osiągnięcia tej liczby znaków
      maxChars: 3000, // wymuś podział po przekroczeniu tego limitu
      idleMs: 5000, // automatycznie opróżnij bufor po okresie bezczynności (ms)
    },
  },
}
```

Ustaw `outboundQueueStrategy: "immediate"`, aby wysyłać każdy fragment bez buforowania.

## Typowe polecenia

| Polecenie  | Opis                               |
| ---------- | ---------------------------------- |
| `/help`    | Wyświetla dostępne polecenia       |
| `/status`  | Wyświetla stan bota                |
| `/new`     | Rozpoczyna nową sesję              |
| `/stop`    | Zatrzymuje bieżące wykonanie       |
| `/restart` | Uruchamia ponownie OpenClaw        |
| `/compact` | Kompaktuje kontekst sesji          |

Yuanbao obsługuje natywne menu poleceń z ukośnikiem; polecenia są automatycznie synchronizowane z platformą podczas uruchamiania Gateway.

## Rozwiązywanie problemów

**Bot nie odpowiada na czatach grupowych:**

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że oznaczasz bota wzmianką @ (domyślnie wymagane)
3. Sprawdź dzienniki: `openclaw logs --follow`

**Bot nie odbiera wiadomości:**

1. Upewnij się, że bot został utworzony i zatwierdzony w aplikacji Yuanbao
2. Upewnij się, że wartości `appKey` i `appSecret` są poprawnie skonfigurowane
3. Upewnij się, że Gateway działa: `openclaw gateway status`
4. Sprawdź dzienniki: `openclaw logs --follow`

**Bot wysyła puste odpowiedzi lub odpowiedzi zastępcze:**

1. Sprawdź, czy model AI zwraca prawidłową treść
2. Domyślna odpowiedź zastępcza: „暂时无法解答，你可以换个问题问问我哦”
3. Dostosuj ją za pomocą `channels.yuanbao.fallbackReply`

**Sekret aplikacji wyciekł:**

1. Zresetuj sekret aplikacji w aplikacji Yuanbao
2. Zaktualizuj wartość w konfiguracji
3. Uruchom ponownie Gateway: `openclaw gateway restart`

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

`defaultAccount` określa konto używane, gdy wychodzące interfejsy API nie podają wartości `accountId`.

### Limity wiadomości

- `maxChars`: maksymalna liczba znaków w pojedynczej wiadomości (domyślnie `3000`)
- `mediaMaxMb`: limit przesyłania i pobierania multimediów (domyślnie `20` MB)
- `overflowPolicy`: działanie po przekroczeniu przez wiadomość limitu: `"split"` (domyślnie) lub `"stop"`

### Przesyłanie strumieniowe

Yuanbao obsługuje strumieniowe wysyłanie danych na poziomie bloków; bot wysyła generowany tekst fragmentami.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // strumieniowanie blokowe włączone (domyślnie)
    },
  },
}
```

Ustaw `disableBlockStreaming: true`, aby wysyłać pełną odpowiedź w jednej wiadomości.

### Kontekst historii czatu grupowego

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // domyślnie: 100; ustaw 0, aby wyłączyć
    },
  },
}
```

Określa liczbę historycznych wiadomości uwzględnianych w kontekście AI czatów grupowych.

### Tryb odpowiedzi z cytatem

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (domyślnie: "first")
    },
  },
}
```

| Wartość | Działanie                                                                       |
| ------- | ------------------------------------------------------------------------------- |
| `off`   | Bez odpowiedzi z cytatem                                                        |
| `first` | Cytuje tylko pierwszą odpowiedź na każdą wiadomość przychodzącą (domyślnie)     |
| `all`   | Cytuje każdą odpowiedź                                                          |

### Wstrzykiwanie wskazówki dotyczącej Markdown

Domyślnie bot wstrzykuje do monitu systemowego instrukcję zapobiegającą umieszczaniu przez model całej odpowiedzi w bloku kodu Markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // domyślnie: true
    },
  },
}
```

### Tryb debugowania

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Włącza nieoczyszczone dane wyjściowe dziennika dla wymienionych identyfikatorów botów.

### Kierowanie do wielu agentów

Użyj `bindings`, aby kierować wiadomości bezpośrednie lub grupy Yuanbao do różnych agentów:

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

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (wiadomość bezpośrednia) lub `"group"` (czat grupowy)
- `match.peer.id`: identyfikator użytkownika lub kod grupy

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/pl/gateway/configuration)

| Ustawienie                                 | Opis                                                        | Wartość domyślna                       |
| ------------------------------------------ | ----------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Włącza lub wyłącza kanał                                    | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Domyślne konto do kierowania wychodzącego                    | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | Klucz aplikacji (podpisywanie i generowanie biletu)          | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | Sekret aplikacji (podpisywanie)                              | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Wstępnie podpisany token (pomija automatyczne podpisywanie biletu) | -                                 |
| `channels.yuanbao.accounts.<id>.name`      | Wyświetlana nazwa konta                                     | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Włącza lub wyłącza określone konto                           | `true`                                 |
| `channels.yuanbao.dm.policy`               | Polityka wiadomości bezpośrednich                            | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Lista dozwolonych nadawców wiadomości bezpośrednich (lista identyfikatorów użytkowników) | -                 |
| `channels.yuanbao.requireMention`          | Wymaga wzmianki @ w grupach                                  | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Obsługa długich wiadomości (`split` lub `stop`)              | `split`                                |
| `channels.yuanbao.replyToMode`             | Strategia odpowiedzi z cytatem w grupach (`off`, `first`, `all`) | `first`                            |
| `channels.yuanbao.outboundQueueStrategy`   | Strategia wychodząca (`merge-text` lub `immediate`)          | `merge-text`                           |
| `channels.yuanbao.minChars`                | Łączenie tekstu: minimalna liczba znaków wyzwalająca wysłanie | `2800`                                |
| `channels.yuanbao.maxChars`                | Łączenie tekstu: maksymalna liczba znaków na wiadomość       | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Łączenie tekstu: czas bezczynności przed automatycznym opróżnieniem bufora (ms) | `5000`             |
| `channels.yuanbao.mediaMaxMb`              | Limit rozmiaru multimediów (MB)                              | `20`                                   |
| `channels.yuanbao.historyLimit`            | Liczba wpisów historii czatu grupowego w kontekście          | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Wyłącza strumieniowe wysyłanie na poziomie bloków            | `false`                                |
| `channels.yuanbao.fallbackReply`           | Odpowiedź zastępcza, gdy model nie zwróci treści              | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Wstrzykuje instrukcje zapobiegające opakowywaniu odpowiedzi w Markdown | `true`                       |
| `channels.yuanbao.debugBotIds`             | Lista dozwolonych identyfikatorów botów w trybie debugowania (nieoczyszczone dzienniki) | `[]`             |

## Obsługiwane typy wiadomości

**Odbieranie:** tekst, obrazy, pliki, dźwięk/głos, wideo, naklejki/niestandardowe emoji, elementy niestandardowe (karty łączy).

**Wysyłanie:** tekst (Markdown), obrazy, pliki, dźwięk, wideo, naklejki.

**Wątki i odpowiedzi:** odpowiedzi z cytatem (konfigurowane za pomocą `replyToMode`); platforma nie obsługuje odpowiedzi w wątkach.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i proces parowania
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i wymaganie wzmianek
- [Kierowanie kanałów](/pl/channels/channel-routing) — kierowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
