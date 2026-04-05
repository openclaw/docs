---
read_when:
    - Chcesz połączyć bota Feishu/Lark
    - Konfigurujesz kanał Feishu
summary: Przegląd bota Feishu, funkcje i konfiguracja
title: Feishu
x-i18n:
    generated_at: "2026-04-05T13:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Bot Feishu

Feishu (Lark) to platforma czatu zespołowego używana przez firmy do komunikacji i współpracy. Ten plugin łączy OpenClaw z botem Feishu/Lark przy użyciu subskrypcji zdarzeń WebSocket platformy, dzięki czemu wiadomości mogą być odbierane bez udostępniania publicznego adresu URL webhooka.

---

## Dołączony plugin

Feishu jest dołączony do aktualnych wydań OpenClaw, więc nie jest wymagana osobna instalacja pluginu.

Jeśli używasz starszej wersji lub niestandardowej instalacji, która nie zawiera dołączonego
Feishu, zainstaluj go ręcznie:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Szybki start

Są dwa sposoby dodania kanału Feishu:

### Metoda 1: onboarding (zalecane)

Jeśli właśnie zainstalowano OpenClaw, uruchom onboarding:

```bash
openclaw onboard
```

Kreator przeprowadzi Cię przez:

1. Utworzenie aplikacji Feishu i zebranie danych uwierzytelniających
2. Skonfigurowanie danych uwierzytelniających aplikacji w OpenClaw
3. Uruchomienie gateway

✅ **Po konfiguracji** sprawdź stan gateway:

- `openclaw gateway status`
- `openclaw logs --follow`

### Metoda 2: konfiguracja przez CLI

Jeśli początkowa instalacja została już ukończona, dodaj kanał przez CLI:

```bash
openclaw channels add
```

Wybierz **Feishu**, a następnie wprowadź App ID i App Secret.

✅ **Po konfiguracji** zarządzaj gateway:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Krok 1: Utwórz aplikację Feishu

### 1. Otwórz Feishu Open Platform

Odwiedź [Feishu Open Platform](https://open.feishu.cn/app) i zaloguj się.

Dzierżawy Lark (globalne) powinny używać [https://open.larksuite.com/app](https://open.larksuite.com/app) i ustawić `domain: "lark"` w konfiguracji Feishu.

### 2. Utwórz aplikację

1. Kliknij **Create enterprise app**
2. Wypełnij nazwę i opis aplikacji
3. Wybierz ikonę aplikacji

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. Skopiuj dane uwierzytelniające

Z sekcji **Credentials & Basic Info** skopiuj:

- **App ID** (format: `cli_xxx`)
- **App Secret**

❗ **Ważne:** zachowaj App Secret w tajemnicy.

![Get credentials](/images/feishu-step3-credentials.png)

### 4. Skonfiguruj uprawnienia

W sekcji **Permissions** kliknij **Batch import** i wklej:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. Włącz możliwości bota

W **App Capability** > **Bot**:

1. Włącz możliwości bota
2. Ustaw nazwę bota

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. Skonfiguruj subskrypcję zdarzeń

⚠️ **Ważne:** przed skonfigurowaniem subskrypcji zdarzeń upewnij się, że:

1. `openclaw channels add` zostało już uruchomione dla Feishu
2. Gateway jest uruchomiony (`openclaw gateway status`)

W sekcji **Event Subscription**:

1. Wybierz **Use long connection to receive events** (WebSocket)
2. Dodaj zdarzenie: `im.message.receive_v1`
3. (Opcjonalnie) Dla workflow komentarzy Drive dodaj też: `drive.notice.comment_add_v1`

⚠️ Jeśli gateway nie jest uruchomiony, konfiguracja long connection może nie zostać zapisana.

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. Opublikuj aplikację

1. Utwórz wersję w **Version Management & Release**
2. Wyślij do przeglądu i opublikuj
3. Poczekaj na zatwierdzenie przez administratora (aplikacje firmowe zwykle są zatwierdzane automatycznie)

---

## Krok 2: Skonfiguruj OpenClaw

### Skonfiguruj za pomocą kreatora (zalecane)

```bash
openclaw channels add
```

Wybierz **Feishu** i wklej swój App ID oraz App Secret.

### Skonfiguruj przez plik config

Edytuj `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Mój asystent AI",
        },
      },
    },
  },
}
```

Jeśli używasz `connectionMode: "webhook"`, ustaw zarówno `verificationToken`, jak i `encryptKey`. Serwer webhooków Feishu domyślnie nasłuchuje na `127.0.0.1`; ustaw `webhookHost` tylko wtedy, gdy celowo potrzebujesz innego adresu nasłuchiwania.

#### Verification Token i Encrypt Key (tryb webhook)

Podczas używania trybu webhook ustaw w konfiguracji zarówno `channels.feishu.verificationToken`, jak i `channels.feishu.encryptKey`. Aby uzyskać te wartości:

1. W Feishu Open Platform otwórz swoją aplikację
2. Przejdź do **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Otwórz kartę **Encryption** (加密策略)
4. Skopiuj **Verification Token** i **Encrypt Key**

Poniższy zrzut ekranu pokazuje, gdzie znaleźć **Verification Token**. **Encrypt Key** znajduje się w tej samej sekcji **Encryption**.

![Verification Token location](/images/feishu-verification-token.png)

### Skonfiguruj przez zmienne środowiskowe

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Domena Lark (globalna)

Jeśli Twoja dzierżawa działa w Lark (międzynarodowym), ustaw domenę na `lark` (lub pełny ciąg domeny). Można to ustawić w `channels.feishu.domain` albo per konto (`channels.feishu.accounts.<id>.domain`).

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Flagi optymalizacji limitów

Możesz ograniczyć użycie API Feishu za pomocą dwóch opcjonalnych flag:

- `typingIndicator` (domyślnie `true`): gdy ustawione na `false`, pomija wywołania reakcji wpisywania.
- `resolveSenderNames` (domyślnie `true`): gdy ustawione na `false`, pomija wywołania wyszukiwania profilu nadawcy.

Ustaw je na poziomie głównym lub per konto:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Krok 3: Uruchom + przetestuj

### 1. Uruchom gateway

```bash
openclaw gateway
```

### 2. Wyślij wiadomość testową

W Feishu znajdź swojego bota i wyślij wiadomość.

### 3. Zatwierdź parowanie

Domyślnie bot odpowiada kodem parowania. Zatwierdź go:

```bash
openclaw pairing approve feishu <CODE>
```

Po zatwierdzeniu możesz normalnie rozmawiać.

---

## Przegląd

- **Kanał bota Feishu**: bot Feishu zarządzany przez gateway
- **Deterministyczne routowanie**: odpowiedzi zawsze wracają do Feishu
- **Izolacja sesji**: wiadomości prywatne współdzielą główną sesję; grupy są izolowane
- **Połączenie WebSocket**: long connection przez SDK Feishu, bez potrzeby używania publicznego URL

---

## Kontrola dostępu

### Wiadomości prywatne

- **Domyślnie**: `dmPolicy: "pairing"` (nieznani użytkownicy otrzymują kod parowania)
- **Zatwierdź parowanie**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Tryb allowlist**: ustaw `channels.feishu.allowFrom` z dozwolonymi Open ID

### Czaty grupowe

**1. Zasada grupy** (`channels.feishu.groupPolicy`):

- `"open"` = zezwól wszystkim w grupach
- `"allowlist"` = zezwól tylko `groupAllowFrom`
- `"disabled"` = wyłącz wiadomości grupowe

Domyślnie: `allowlist`

**2. Wymaganie wzmianki** (`channels.feishu.requireMention`, z możliwością nadpisania przez `channels.feishu.groups.<chat_id>.requireMention`):

- jawne `true` = wymagaj @wzmianki
- jawne `false` = odpowiadaj bez wzmianek
- gdy nieustawione i `groupPolicy: "open"` = domyślnie `false`
- gdy nieustawione i `groupPolicy` nie jest `"open"` = domyślnie `true`

---

## Przykłady konfiguracji grup

### Zezwól na wszystkie grupy, bez wymagania @wzmianki (domyślnie dla otwartych grup)

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
      // Identyfikatory grup Feishu (chat_id) wyglądają tak: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Ogranicz, którzy nadawcy mogą wysyłać wiadomości w grupie (allowlist nadawców)

Oprócz zezwolenia na samą grupę, **wszystkie wiadomości** w tej grupie są filtrowane według `open_id` nadawcy: przetwarzane są tylko wiadomości użytkowników wymienionych w `groups.<chat_id>.allowFrom`; wiadomości od pozostałych członków są ignorowane (to pełne filtrowanie na poziomie nadawcy, a nie tylko dla poleceń sterujących takich jak /reset lub /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Identyfikatory użytkowników Feishu (open_id) wyglądają tak: ou_xxx
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

### Identyfikatory grup (chat_id)

Identyfikatory grup wyglądają tak: `oc_xxx`.

**Metoda 1 (zalecana)**

1. Uruchom gateway i użyj @wzmianki bota w grupie
2. Uruchom `openclaw logs --follow` i poszukaj `chat_id`

**Metoda 2**

Użyj debuggera API Feishu, aby wyświetlić listę czatów grupowych.

### Identyfikatory użytkowników (open_id)

Identyfikatory użytkowników wyglądają tak: `ou_xxx`.

**Metoda 1 (zalecana)**

1. Uruchom gateway i wyślij wiadomość prywatną do bota
2. Uruchom `openclaw logs --follow` i poszukaj `open_id`

**Metoda 2**

Sprawdź żądania parowania dla Open ID użytkowników:

```bash
openclaw pairing list feishu
```

---

## Typowe polecenia

| Polecenie | Opis                  |
| --------- | --------------------- |
| `/status` | Pokaż stan bota       |
| `/reset`  | Zresetuj sesję        |
| `/model`  | Pokaż/przełącz model  |

> Uwaga: Feishu nie obsługuje jeszcze natywnych menu poleceń, więc polecenia muszą być wysyłane jako tekst.

## Polecenia zarządzania gateway

| Polecenie                 | Opis                          |
| ------------------------- | ----------------------------- |
| `openclaw gateway status`  | Pokaż stan gateway           |
| `openclaw gateway install` | Zainstaluj/uruchom usługę gateway |
| `openclaw gateway stop`    | Zatrzymaj usługę gateway     |
| `openclaw gateway restart` | Uruchom ponownie usługę gateway |
| `openclaw logs --follow`   | Śledź logi gateway           |

---

## Rozwiązywanie problemów

### Bot nie odpowiada w czatach grupowych

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że używasz @wzmianki bota (zachowanie domyślne)
3. Sprawdź, czy `groupPolicy` nie jest ustawione na `"disabled"`
4. Sprawdź logi: `openclaw logs --follow`

### Bot nie odbiera wiadomości

1. Upewnij się, że aplikacja została opublikowana i zatwierdzona
2. Upewnij się, że subskrypcja zdarzeń zawiera `im.message.receive_v1`
3. Upewnij się, że **long connection** jest włączone
4. Upewnij się, że uprawnienia aplikacji są kompletne
5. Upewnij się, że gateway jest uruchomiony: `openclaw gateway status`
6. Sprawdź logi: `openclaw logs --follow`

### Wyciek App Secret

1. Zresetuj App Secret w Feishu Open Platform
2. Zaktualizuj App Secret w swojej konfiguracji
3. Uruchom ponownie gateway

### Błędy wysyłania wiadomości

1. Upewnij się, że aplikacja ma uprawnienie `im:message:send_as_bot`
2. Upewnij się, że aplikacja została opublikowana
3. Sprawdź logi pod kątem szczegółowych błędów

---

## Zaawansowana konfiguracja

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
          name: "Podstawowy bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Zapasowy bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kontroluje, które konto Feishu jest używane, gdy wychodzące API nie określają jawnie `accountId`.

### Limity wiadomości

- `textChunkLimit`: rozmiar fragmentu tekstu wychodzącego (domyślnie: 2000 znaków)
- `mediaMaxMb`: limit wysyłania/pobierania multimediów (domyślnie: 30MB)

### Streaming

Feishu obsługuje odpowiedzi strumieniowe przez karty interaktywne. Gdy jest włączone, bot aktualizuje kartę podczas generowania tekstu.

```json5
{
  channels: {
    feishu: {
      streaming: true, // włącz wyjście strumieniowe kart (domyślnie true)
      blockStreaming: true, // włącz streaming na poziomie bloków (domyślnie true)
    },
  },
}
```

Ustaw `streaming: false`, aby poczekać na pełną odpowiedź przed wysłaniem.

### Sesje ACP

Feishu obsługuje ACP dla:

- wiadomości prywatnych
- rozmów grupowych w wątkach tematycznych

ACP w Feishu jest sterowane poleceniami tekstowymi. Nie ma natywnych menu poleceń typu slash, więc używaj wiadomości `/acp ...` bezpośrednio w rozmowie.

#### Trwałe powiązania ACP

Użyj typowanych powiązań ACP na poziomie głównym, aby przypiąć wiadomość prywatną Feishu lub rozmowę tematyczną do trwałej sesji ACP.

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

#### Uruchamianie ACP powiązanego z wątkiem z czatu

W wiadomości prywatnej Feishu lub rozmowie tematycznej możesz uruchomić i powiązać sesję ACP bezpośrednio na miejscu:

```text
/acp spawn codex --thread here
```

Uwagi:

- `--thread here` działa dla wiadomości prywatnych i tematów Feishu.
- Kolejne wiadomości w powiązanej wiadomości prywatnej/temacie są routowane bezpośrednio do tej sesji ACP.
- Wersja v1 nie obsługuje ogólnych czatów grupowych bez tematów.

### Routowanie wielu agentów

Użyj `bindings`, aby routować wiadomości prywatne lub grupy Feishu do różnych agentów.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Pola routowania:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` lub `"group"`
- `match.peer.id`: Open ID użytkownika (`ou_xxx`) lub ID grupy (`oc_xxx`)

Wskazówki dotyczące wyszukiwania znajdziesz w sekcji [Pobieranie identyfikatorów grup/użytkowników](#get-groupuser-ids).

---

## Odniesienie do konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/gateway/configuration)

Najważniejsze opcje:

| Ustawienie                                        | Opis                                    | Domyślnie        |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Włącz/wyłącz kanał                      | `true`           |
| `channels.feishu.domain`                          | Domena API (`feishu` lub `lark`)        | `feishu`         |
| `channels.feishu.connectionMode`                  | Tryb transportu zdarzeń                 | `websocket`      |
| `channels.feishu.defaultAccount`                  | Domyślne ID konta dla routowania wychodzącego | `default`  |
| `channels.feishu.verificationToken`               | Wymagane dla trybu webhook              | -                |
| `channels.feishu.encryptKey`                      | Wymagane dla trybu webhook              | -                |
| `channels.feishu.webhookPath`                     | Ścieżka trasy webhooka                  | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host nasłuchiwania webhooka             | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port nasłuchiwania webhooka             | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`            | Nadpisanie domeny API per konto         | `feishu`         |
| `channels.feishu.dmPolicy`                        | Zasada wiadomości prywatnych            | `pairing`        |
| `channels.feishu.allowFrom`                       | Allowlist wiadomości prywatnych (lista `open_id`) | -      |
| `channels.feishu.groupPolicy`                     | Zasada grup                             | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Allowlist grup                          | -                |
| `channels.feishu.requireMention`                  | Domyślnie wymagaj @wzmianki             | warunkowe        |
| `channels.feishu.groups.<chat_id>.requireMention` | Nadpisanie wymagania @wzmianki per grupa | dziedziczone    |
| `channels.feishu.groups.<chat_id>.enabled`        | Włącz grupę                             | `true`           |
| `channels.feishu.textChunkLimit`                  | Rozmiar fragmentu wiadomości            | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limit rozmiaru mediów                   | `30`             |
| `channels.feishu.streaming`                       | Włącz strumieniowe wyjście kart         | `true`           |
| `channels.feishu.blockStreaming`                  | Włącz streaming bloków                  | `true`           |

---

## Odniesienie do dmPolicy

| Wartość       | Zachowanie                                                      |
| ------------- | --------------------------------------------------------------- |
| `"pairing"`   | **Domyślnie.** Nieznani użytkownicy otrzymują kod parowania; muszą zostać zatwierdzeni |
| `"allowlist"` | Tylko użytkownicy z `allowFrom` mogą rozmawiać                  |
| `"open"`      | Zezwól wszystkim użytkownikom (wymaga `"*"` w `allowFrom`)     |
| `"disabled"`  | Wyłącz wiadomości prywatne                                      |

---

## Obsługiwane typy wiadomości

### Odbieranie

- ✅ Tekst
- ✅ Tekst sformatowany (post)
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/media
- ✅ Naklejki

### Wysyłanie

- ✅ Tekst
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/media
- ✅ Karty interaktywne
- ⚠️ Tekst sformatowany (formatowanie w stylu post i karty, ale nie dowolne funkcje autorskie Feishu)

### Wątki i odpowiedzi

- ✅ Odpowiedzi inline
- ✅ Odpowiedzi w wątkach tematycznych, gdy Feishu udostępnia `reply_in_thread`
- ✅ Odpowiedzi multimedialne zachowują świadomość wątku podczas odpowiadania na wiadomość w wątku/temacie

## Komentarze Drive

Feishu może wyzwolić agenta, gdy ktoś doda komentarz do dokumentu Feishu Drive (Docs, Sheets
itp.). Agent otrzymuje treść komentarza, kontekst dokumentu i wątek komentarzy, dzięki czemu może
odpowiedzieć w wątku lub edytować dokument.

Wymagania:

- Subskrybuj `drive.notice.comment_add_v1` w ustawieniach subskrypcji zdarzeń aplikacji Feishu
  (obok istniejącego `im.message.receive_v1`)
- Narzędzie Drive jest domyślnie włączone; wyłącz je przez `channels.feishu.tools.drive: false`

Narzędzie `feishu_drive` udostępnia następujące akcje komentarzy:

| Akcja                 | Opis                                  |
| --------------------- | ------------------------------------- |
| `list_comments`        | Wyświetl komentarze dokumentu        |
| `list_comment_replies` | Wyświetl odpowiedzi w wątku komentarzy |
| `add_comment`          | Dodaj nowy komentarz najwyższego poziomu |
| `reply_comment`        | Odpowiedz w istniejącym wątku komentarzy |

Gdy agent obsługuje zdarzenie komentarza Drive, otrzymuje:

- treść komentarza i nadawcę
- metadane dokumentu (tytuł, typ, URL)
- kontekst wątku komentarzy do odpowiedzi w wątku

Po wprowadzeniu zmian w dokumencie agent otrzymuje wskazówkę, aby użyć `feishu_drive.reply_comment` do powiadomienia
komentującego, a następnie wypisać dokładny cichy token `NO_REPLY` / `no_reply`, aby
uniknąć zduplikowanych wysyłek.

## Powierzchnia akcji runtime

Feishu obecnie udostępnia następujące akcje runtime:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` i `reactions`, gdy reakcje są włączone w konfiguracji
- akcje komentarzy `feishu_drive`: `list_comments`, `list_comment_replies`, `add_comment`, `reply_comment`

## Powiązane

- [Przegląd kanałów](/channels) — wszystkie obsługiwane kanały
- [Pairing](/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/channels/groups) — zachowanie czatów grupowych i filtrowanie wzmiankami
- [Routowanie kanałów](/channels/channel-routing) — routowanie sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
