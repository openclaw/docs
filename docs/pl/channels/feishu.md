---
read_when:
    - Chcesz połączyć bota Feishu/Lark
    - Konfigurujesz kanał Feishu
summary: Przegląd, funkcje i konfiguracja bota Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-24T08:57:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68a03c457fb2be7654f298fbad759705983d9e673b7b7b950609694894bdcbc
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark to wszechstronna platforma do współpracy, w której zespoły rozmawiają, udostępniają dokumenty, zarządzają kalendarzami i wspólnie wykonują pracę.

**Status:** gotowe do użycia produkcyjnego dla wiadomości prywatnych bota i czatów grupowych. Domyślnym trybem jest WebSocket; tryb Webhook jest opcjonalny.

---

## Szybki start

> **Wymaga OpenClaw 2026.4.24 lub nowszego.** Uruchom `openclaw --version`, aby sprawdzić wersję. Zaktualizuj za pomocą `openclaw update`.

<Steps>
  <Step title="Uruchom kreatora konfiguracji kanału">
  ```bash
  openclaw channels login --channel feishu
  ```
  Zeskanuj kod QR w aplikacji mobilnej Feishu/Lark, aby automatycznie utworzyć bota Feishu/Lark.
  </Step>
  
  <Step title="Po zakończeniu konfiguracji uruchom ponownie Gateway, aby zastosować zmiany">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrola dostępu

### Wiadomości prywatne

Skonfiguruj `dmPolicy`, aby określić, kto może wysyłać botowi wiadomości prywatne:

- `"pairing"` — nieznani użytkownicy otrzymują kod parowania; zatwierdź go przez CLI
- `"allowlist"` — tylko użytkownicy wymienieni w `allowFrom` mogą rozmawiać (domyślnie: tylko właściciel bota)
- `"open"` — zezwól wszystkim użytkownikom
- `"disabled"` — wyłącz wszystkie wiadomości prywatne

**Zatwierdzanie prośby o parowanie:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Czaty grupowe

**Polityka grup** (`channels.feishu.groupPolicy`):

| Value         | Behavior                                 |
| ------------- | ---------------------------------------- |
| `"open"`      | Odpowiadaj na wszystkie wiadomości w grupach |
| `"allowlist"` | Odpowiadaj tylko w grupach z `groupAllowFrom` |
| `"disabled"`  | Wyłącz wszystkie wiadomości grupowe      |

Domyślnie: `allowlist`

**Wymaganie wzmianki** (`channels.feishu.requireMention`):

- `true` — wymagaj @wzmianki (domyślnie)
- `false` — odpowiadaj bez @wzmianki
- Nadpisanie dla konkretnej grupy: `channels.feishu.groups.<chat_id>.requireMention`

---

## Przykłady konfiguracji grup

### Zezwól na wszystkie grupy, bez wymagania @wzmianki

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Zezwól na wszystkie grupy, ale nadal wymagaj @wzmianki

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Zezwól tylko na określone grupy

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Identyfikatory grup wyglądają tak: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Ogranicz nadawców w obrębie grupy

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Identyfikatory open_id użytkowników wyglądają tak: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Pobieranie identyfikatorów grup/użytkowników

### Identyfikatory grup (`chat_id`, format: `oc_xxx`)

Otwórz grupę w Feishu/Lark, kliknij ikonę menu w prawym górnym rogu i przejdź do **Settings**. Identyfikator grupy (`chat_id`) jest widoczny na stronie ustawień.

![Get Group ID](/images/feishu-get-group-id.png)

### Identyfikatory użytkowników (`open_id`, format: `ou_xxx`)

Uruchom Gateway, wyślij do bota wiadomość prywatną, a następnie sprawdź logi:

```bash
openclaw logs --follow
```

Poszukaj `open_id` w danych wyjściowych logów. Możesz też sprawdzić oczekujące prośby o parowanie:

```bash
openclaw pairing list feishu
```

---

## Typowe polecenia

| Command   | Description                    |
| --------- | ------------------------------ |
| `/status` | Pokaż status bota              |
| `/reset`  | Zresetuj bieżącą sesję         |
| `/model`  | Pokaż lub przełącz model AI    |

> Feishu/Lark nie obsługuje natywnych menu poleceń ukośnikowych, więc wysyłaj je jako zwykłe wiadomości tekstowe.

---

## Rozwiązywanie problemów

### Bot nie odpowiada na czatach grupowych

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że oznaczasz bota przez @wzmiankę (domyślnie jest to wymagane)
3. Sprawdź, czy `groupPolicy` nie ma wartości `"disabled"`
4. Sprawdź logi: `openclaw logs --follow`

### Bot nie odbiera wiadomości

1. Upewnij się, że bot został opublikowany i zatwierdzony w Feishu Open Platform / Lark Developer
2. Upewnij się, że subskrypcja zdarzeń obejmuje `im.message.receive_v1`
3. Upewnij się, że wybrano **persistent connection** (WebSocket)
4. Upewnij się, że przyznano wszystkie wymagane zakresy uprawnień
5. Upewnij się, że Gateway działa: `openclaw gateway status`
6. Sprawdź logi: `openclaw logs --follow`

### Wyciekł App Secret

1. Zresetuj App Secret w Feishu Open Platform / Lark Developer
2. Zaktualizuj wartość w swojej konfiguracji
3. Uruchom ponownie Gateway: `openclaw gateway restart`

---

## Konfiguracja zaawansowana

### Wiele kont

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Główny bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot zapasowy",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` określa, które konto jest używane, gdy wychodzące API nie podają `accountId`.

### Limity wiadomości

- `textChunkLimit` — rozmiar fragmentu tekstu wychodzącego (domyślnie: `2000` znaków)
- `mediaMaxMb` — limit przesyłania/pobierania multimediów (domyślnie: `30` MB)

### Strumieniowanie

Feishu/Lark obsługuje odpowiedzi strumieniowe za pomocą kart interaktywnych. Po włączeniu bot aktualizuje kartę w czasie rzeczywistym podczas generowania tekstu.

```json5
{
  channels: {
    feishu: {
      streaming: true, // włącza strumieniowe wyjście kart (domyślnie: true)
      blockStreaming: true, // włącza strumieniowanie na poziomie bloków (domyślnie: true)
    },
  },
}
```

Ustaw `streaming: false`, aby wysłać pełną odpowiedź w jednej wiadomości.

### Optymalizacja limitów

Zmniejsz liczbę wywołań API Feishu/Lark za pomocą dwóch opcjonalnych flag:

- `typingIndicator` (domyślnie `true`): ustaw `false`, aby pominąć wywołania reakcji pisania
- `resolveSenderNames` (domyślnie `true`): ustaw `false`, aby pominąć wyszukiwanie profili nadawców

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sesje ACP

Feishu/Lark obsługuje ACP dla wiadomości prywatnych i wiadomości w wątkach grupowych. ACP w Feishu/Lark działa przez polecenia tekstowe — nie ma natywnych menu poleceń ukośnikowych, więc używaj wiadomości `/acp ...` bezpośrednio w rozmowie.

#### Trwałe powiązanie ACP

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Uruchamianie ACP z czatu

W wiadomości prywatnej lub wątku Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` działa w wiadomościach prywatnych i wiadomościach wątków Feishu/Lark. Kolejne wiadomości w powiązanej rozmowie są kierowane bezpośrednio do tej sesji ACP.

### Routing wielu agentów

Użyj `bindings`, aby kierować wiadomości prywatne lub grupy Feishu/Lark do różnych agentów.

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
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Pola routingu:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (wiadomość prywatna) lub `"group"` (czat grupowy)
- `match.peer.id`: Open ID użytkownika (`ou_xxx`) lub identyfikator grupy (`oc_xxx`)

Wskazówki dotyczące wyszukiwania znajdziesz w sekcji [Pobieranie identyfikatorów grup/użytkowników](#get-groupuser-ids).

---

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/pl/gateway/configuration)

| Setting                                           | Description                                | Default          |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Włącz/wyłącz kanał                         | `true`           |
| `channels.feishu.domain`                          | Domena API (`feishu` lub `lark`)           | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport zdarzeń (`websocket` lub `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Domyślne konto dla routingu wychodzącego   | `default`        |
| `channels.feishu.verificationToken`               | Wymagane dla trybu Webhook                 | —                |
| `channels.feishu.encryptKey`                      | Wymagane dla trybu Webhook                 | —                |
| `channels.feishu.webhookPath`                     | Ścieżka trasy Webhook                      | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host powiązania Webhook                    | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port powiązania Webhook                    | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Nadpisanie domeny dla konta                | `feishu`         |
| `channels.feishu.dmPolicy`                        | Polityka wiadomości prywatnych             | `allowlist`      |
| `channels.feishu.allowFrom`                       | Lista dozwolonych dla wiadomości prywatnych (lista `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Polityka grup                              | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Lista dozwolonych grup                     | —                |
| `channels.feishu.requireMention`                  | Wymagaj @wzmianki w grupach                | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Nadpisanie @wzmianki dla grupy             | dziedziczone     |
| `channels.feishu.groups.<chat_id>.enabled`        | Włącz/wyłącz określoną grupę               | `true`           |
| `channels.feishu.textChunkLimit`                  | Rozmiar fragmentu wiadomości               | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limit rozmiaru multimediów                 | `30`             |
| `channels.feishu.streaming`                       | Strumieniowe wyjście kart                  | `true`           |
| `channels.feishu.blockStreaming`                  | Strumieniowanie na poziomie bloków         | `true`           |
| `channels.feishu.typingIndicator`                 | Wysyłaj reakcje pisania                    | `true`           |
| `channels.feishu.resolveSenderNames`              | Rozpoznawaj wyświetlane nazwy nadawców     | `true`           |

---

## Obsługiwane typy wiadomości

### Odbieranie

- ✅ Tekst
- ✅ Tekst sformatowany (post)
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/multimedia
- ✅ Naklejki

### Wysyłanie

- ✅ Tekst
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/multimedia
- ✅ Karty interaktywne (w tym aktualizacje strumieniowe)
- ⚠️ Tekst sformatowany (formatowanie w stylu post; nie obsługuje pełnych możliwości tworzenia treści Feishu/Lark)

### Wątki i odpowiedzi

- ✅ Odpowiedzi w linii
- ✅ Odpowiedzi w wątkach
- ✅ Odpowiedzi z multimediami zachowują świadomość wątku podczas odpowiadania na wiadomość w wątku

---

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
