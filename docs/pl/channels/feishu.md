---
read_when:
    - Chcesz połączyć bota Feishu/Lark
    - Konfigurujesz kanał Feishu
summary: Przegląd bota Feishu, funkcje i konfiguracja
title: Feishu
x-i18n:
    generated_at: "2026-06-27T17:09:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark to kompleksowa platforma współpracy, w której zespoły rozmawiają, udostępniają dokumenty, zarządzają kalendarzami i wspólnie wykonują pracę.

**Status:** gotowe do użycia produkcyjnego dla wiadomości prywatnych bota i czatów grupowych. WebSocket jest trybem domyślnym; tryb webhook jest opcjonalny.

---

## Szybki start

<Note>
Wymaga OpenClaw 2026.5.29 lub nowszego. Uruchom `openclaw --version`, aby sprawdzić. Zaktualizuj za pomocą `openclaw update`.
</Note>

<Steps>
  <Step title="Uruchom kreator konfiguracji kanału">
  ```bash
  openclaw channels login --channel feishu
  ```
  Wybierz konfigurację ręczną, aby wkleić App ID i App Secret z Feishu Open Platform, albo wybierz konfigurację QR, aby automatycznie utworzyć bota. Jeśli krajowa aplikacja mobilna Feishu nie reaguje na kod QR, uruchom konfigurację ponownie i wybierz konfigurację ręczną.
  </Step>
  
  <Step title="Po ukończeniu konfiguracji uruchom ponownie gateway, aby zastosować zmiany">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrola dostępu

### Wiadomości prywatne

Skonfiguruj `dmPolicy`, aby kontrolować, kto może wysyłać wiadomości prywatne do bota:

- `"pairing"` - nieznani użytkownicy otrzymują kod parowania; zatwierdź przez CLI
- `"allowlist"` - czatować mogą tylko użytkownicy wymienieni w `allowFrom`
- `"open"` - zezwalaj na publiczne wiadomości prywatne tylko wtedy, gdy `allowFrom` zawiera `"*"`; przy restrykcyjnych wpisach czatować mogą tylko pasujący użytkownicy
- `"disabled"` - wyłącz wszystkie wiadomości prywatne

**Zatwierdź prośbę o parowanie:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Czaty grupowe

**Zasada grup** (`channels.feishu.groupPolicy`):

| Wartość      | Zachowanie                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `"open"`     | Odpowiadaj na wszystkie wiadomości w grupach                                                       |
| `"allowlist"` | Odpowiadaj tylko w grupach z `groupAllowFrom` lub jawnie skonfigurowanych w `groups.<chat_id>`     |
| `"disabled"` | Wyłącz wszystkie wiadomości grupowe; jawne wpisy `groups.<chat_id>` nie nadpisują tego ustawienia  |

Domyślnie: `allowlist`

**Wymaganie wzmianki** (`channels.feishu.requireMention`):

- `true` - wymagaj @wzmianki (domyślnie)
- `false` - odpowiadaj bez @wzmianki
- Nadpisanie dla grupy: `channels.feishu.groups.<chat_id>.requireMention`
- Wzmianki rozgłoszeniowe `@all` i `@_all` nie są traktowane jako wzmianki o bocie. Wiadomość, która wspomina zarówno `@all`, jak i bezpośrednio bota, nadal liczy się jako wzmianka o bocie.

---

## Przykłady konfiguracji grup

### Zezwól wszystkim grupom, bez wymaganej @wzmianki

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Zezwól wszystkim grupom, nadal wymagaj @wzmianki

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

### Zezwól tylko określonym grupom

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

W trybie `allowlist` możesz też dopuścić grupę, dodając jawny wpis `groups.<chat_id>`. Jawne wpisy nie nadpisują `groupPolicy: "disabled"`. Domyślne ustawienia wieloznaczne w `groups.*` konfigurują pasujące grupy, ale same ich nie dopuszczają.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Ogranicz nadawców w grupie

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Pobierz identyfikatory grup/użytkowników

### Identyfikatory grup (`chat_id`, format: `oc_xxx`)

Otwórz grupę w Feishu/Lark, kliknij ikonę menu w prawym górnym rogu i przejdź do **Ustawienia**. Identyfikator grupy (`chat_id`) znajduje się na stronie ustawień.

![Pobierz identyfikator grupy](/images/feishu-get-group-id.png)

### Identyfikatory użytkowników (`open_id`, format: `ou_xxx`)

Uruchom gateway, wyślij wiadomość prywatną do bota, a następnie sprawdź logi:

```bash
openclaw logs --follow
```

Poszukaj `open_id` w danych wyjściowych logu. Możesz też sprawdzić oczekujące prośby o parowanie:

```bash
openclaw pairing list feishu
```

---

## Typowe polecenia

| Polecenie | Opis                              |
| --------- | --------------------------------- |
| `/status` | Pokaż status bota                 |
| `/reset`  | Zresetuj bieżącą sesję            |
| `/model`  | Pokaż lub przełącz model AI       |

<Note>
Feishu/Lark nie obsługuje natywnych menu poleceń ukośnikowych, więc wysyłaj je jako zwykłe wiadomości tekstowe.
</Note>

---

## Rozwiązywanie problemów

### Bot nie odpowiada w czatach grupowych

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że @wspominasz bota (domyślnie wymagane)
3. Sprawdź, czy `groupPolicy` nie ma wartości `"disabled"`
4. Sprawdź logi: `openclaw logs --follow`

### Bot nie otrzymuje wiadomości

1. Upewnij się, że bot jest opublikowany i zatwierdzony w Feishu Open Platform / Lark Developer
2. Upewnij się, że subskrypcja zdarzeń obejmuje `im.message.receive_v1`
3. Upewnij się, że wybrano **trwałe połączenie** (WebSocket)
4. Upewnij się, że przyznano wszystkie wymagane zakresy uprawnień
5. Upewnij się, że gateway działa: `openclaw gateway status`
6. Sprawdź logi: `openclaw logs --follow`

### Konfiguracja QR nie reaguje w aplikacji mobilnej Feishu

1. Uruchom konfigurację ponownie: `openclaw channels login --channel feishu`
2. Wybierz konfigurację ręczną
3. W Feishu Open Platform utwórz aplikację self-built i skopiuj jej App ID oraz App Secret
4. Wklej te dane uwierzytelniające do kreatora konfiguracji

### Wyciekł App Secret

1. Zresetuj App Secret w Feishu Open Platform / Lark Developer
2. Zaktualizuj wartość w konfiguracji
3. Uruchom ponownie gateway: `openclaw gateway restart`

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kontroluje, które konto jest używane, gdy wychodzące API nie określają `accountId`.
`accounts.<id>.tts` używa tego samego kształtu co `messages.tts` i wykonuje głębokie scalanie nad
globalną konfiguracją TTS, dzięki czemu konfiguracje Feishu z wieloma botami mogą przechowywać wspólne
dane uwierzytelniające dostawców globalnie, nadpisując dla konta tylko głos, model, personę lub tryb automatyczny.

### Limity wiadomości

- `textChunkLimit` - rozmiar fragmentu tekstu wychodzącego (domyślnie: `2000` znaków)
- `mediaMaxMb` - limit przesyłania/pobierania multimediów (domyślnie: `30` MB)

### Streaming

Feishu/Lark obsługuje odpowiedzi strumieniowe przez karty interaktywne. Po włączeniu bot aktualizuje kartę w czasie rzeczywistym podczas generowania tekstu.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Ustaw `streaming: false`, aby wysyłać pełną odpowiedź w jednej wiadomości. `blockStreaming` jest domyślnie wyłączone; włącz je tylko wtedy, gdy chcesz opróżniać ukończone bloki asystenta przed końcową odpowiedzią.

### Optymalizacja limitu

Zmniejsz liczbę wywołań API Feishu/Lark za pomocą dwóch opcjonalnych flag:

- `typingIndicator` (domyślnie `true`): ustaw `false`, aby pominąć wywołania reakcji pisania
- `resolveSenderNames` (domyślnie `true`): ustaw `false`, aby pominąć pobieranie profili nadawców

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

Feishu/Lark obsługuje ACP dla wiadomości prywatnych i wiadomości w wątkach grupowych. ACP w Feishu/Lark jest sterowane poleceniami tekstowymi - nie ma natywnych menu poleceń ukośnikowych, więc używaj wiadomości `/acp ...` bezpośrednio w rozmowie.

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

#### Uruchom ACP z czatu

W wiadomości prywatnej lub wątku Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` działa dla wiadomości prywatnych i wiadomości w wątkach Feishu/Lark. Kolejne wiadomości w powiązanej rozmowie trafiają bezpośrednio do tej sesji ACP.

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

Zobacz [Pobierz identyfikatory grup/użytkowników](#get-groupuser-ids), aby uzyskać wskazówki dotyczące wyszukiwania.

---

## Izolacja agenta dla użytkownika (dynamiczne tworzenie agentów)

Włącz `dynamicAgentCreation`, aby automatycznie tworzyć **izolowane instancje agentów** dla każdego użytkownika wiadomości prywatnych. Każdy użytkownik otrzymuje własne:

- Niezależny katalog roboczy
- Oddzielne `USER.md` / `SOUL.md` / `MEMORY.md`
- Prywatną historię rozmów
- Izolowane Skills i stan

Jest to niezbędne dla publicznych botów, gdy chcesz, aby każdy użytkownik miał własne prywatne doświadczenie asystenta AI.

<Note>
Dynamiczne powiązania obejmują znormalizowany Feishu `accountId`, więc konta domyślne i nazwane kierują każdego nadawcę do właściwego dynamicznego agenta.

Jeśli nazwane konto utworzyło dynamicznego agenta bez zakresu w starszym wydaniu, ten starszy agent nadal wlicza się do `maxAgents`. Przed usunięciem potwierdź, że nie jest używany przez konto domyślne, albo tymczasowo zwiększ `maxAgents`; OpenClaw nie może bezpiecznie wywnioskować, które konto jest właścicielem niejednoznacznego starszego stanu.
</Note>

### Szybka konfiguracja

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Jak to działa

Gdy nowy użytkownik wysyła pierwszą wiadomość prywatną:

1. Kanał generuje unikalny `agentId`: `feishu-{user_open_id}` dla konta domyślnego albo ograniczony skrót tożsamości z prefiksem konta dla konta nazwanego
2. Tworzy nowy katalog roboczy w ścieżce `workspaceTemplate`
3. Rejestruje agenta i tworzy powiązanie dla tego użytkownika
4. Pomocnik katalogu roboczego zapewnia pliki startowe (`AGENTS.md`, `SOUL.md`, `USER.md` itd.) przy pierwszym dostępie
5. Kieruje wszystkie przyszłe wiadomości od tego użytkownika do jego dedykowanego agenta

### Opcje konfiguracji

| Ustawienie                                               | Opis                                               | Domyślnie                            |
| -------------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Włącz automatyczne tworzenie agenta dla użytkownika | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Szablon ścieżki dla dynamicznych przestrzeni roboczych agenta | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Szablon nazwy katalogu agenta                      | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maksymalna liczba dynamicznych agentów do utworzenia | nieograniczone                       |

Zmienne szablonu:

- `{agentId}` - wygenerowany identyfikator agenta (np. `feishu-ou_xxxxxx` lub `feishu-support-<identity_digest>`)
- `{userId}` - Feishu open_id nadawcy (np. `ou_xxxxxx`)

### Zakres sesji

`session.dmScope` kontroluje, jak wiadomości bezpośrednie są mapowane na sesje agenta. To jest **ustawienie globalne**, które wpływa na wszystkie kanały.

| Wartość                     | Zachowanie                                                         | Najlepsze do                                                        |
| --------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `"main"`                    | DM każdego użytkownika mapuje się na główną sesję jego agenta      | Boty dla jednego użytkownika, gdy chcesz automatycznie ładować `USER.md` / `SOUL.md` |
| `"per-channel-peer"`        | Każda kombinacja (kanał + użytkownik) otrzymuje osobną sesję       | Publiczne boty wieloużytkownikowe wymagające silniejszej izolacji   |
| `"per-account-channel-peer"` | Każda kombinacja (konto + kanał + użytkownik) otrzymuje osobną sesję | Boty wielokontowe wymagające izolacji sesji na poziomie konta       |

**Kompromis**: Użycie `"main"` włącza automatyczne ładowanie plików startowych (`USER.md`, `SOUL.md`, `MEMORY.md`), ale oznacza, że wszystkie DM we wszystkich kanałach współdzielą ten sam wzorzec klucza sesji. W przypadku publicznych botów wieloużytkownikowych, gdzie izolacja jest ważniejsza niż automatyczne ładowanie plików startowych, rozważ `"per-channel-peer"` i zarządzaj plikami startowymi ręcznie.

<Note>
Użyj `"per-account-channel-peer"`, gdy nazwane konta Feishu powinny utrzymywać osobne sesje dla tego samego nadawcy. Dynamiczne powiązania zachowują zakres konta.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### Typowe wdrożenie wieloużytkownikowe

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Weryfikacja

Sprawdź logi Gateway, aby potwierdzić, że dynamiczne tworzenie działa:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Wyświetl wszystkie utworzone przestrzenie robocze:

```bash
ls -la ~/.openclaw/workspace-*
```

### Uwagi

- **Izolacja przestrzeni roboczej**: Każdy użytkownik otrzymuje własny katalog przestrzeni roboczej i instancję agenta. Użytkownicy nie mogą widzieć historii rozmów ani plików innych użytkowników w normalnym przepływie wiadomości.
- **Granica bezpieczeństwa**: To mechanizm izolacji kontekstu wiadomości, a nie granica bezpieczeństwa przed wrogim współdzierżawcą. Proces agenta i środowisko hosta są współdzielone.
- **`bindings` powinno być puste**: Dynamiczni agenci automatycznie rejestrują własne powiązania
- **Ścieżka aktualizacji**: Istniejące ręczne powiązania nadal działają obok dynamicznych agentów
- **`session.dmScope` jest globalne**: Wpływa to na wszystkie kanały, nie tylko Feishu

---

## Odniesienie konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/pl/gateway/configuration)

| Ustawienie                                               | Opis                                                                             | Domyślnie                            |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | Włącz/wyłącz kanał                                                               | `true`                               |
| `channels.feishu.domain`                                 | Domena API (`feishu` lub `lark`)                                                 | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transport zdarzeń (`websocket` lub `webhook`)                                    | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Domyślne konto do routingu wychodzącego                                          | `default`                            |
| `channels.feishu.verificationToken`                      | Wymagane dla trybu Webhook                                                       | -                                    |
| `channels.feishu.encryptKey`                             | Wymagane dla trybu Webhook                                                       | -                                    |
| `channels.feishu.webhookPath`                            | Ścieżka trasy Webhook                                                            | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host powiązania Webhook                                                          | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Port powiązania Webhook                                                          | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | Identyfikator aplikacji                                                          | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Sekret aplikacji                                                                 | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Nadpisanie domeny dla konta                                                      | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Nadpisanie TTS dla konta                                                         | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Zasady DM                                                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | Lista dozwolonych DM (lista open_id)                                             | -                                    |
| `channels.feishu.groupPolicy`                            | Zasady grup                                                                      | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Lista dozwolonych grup                                                           | -                                    |
| `channels.feishu.requireMention`                         | Wymagaj @wzmianki w grupach                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | Nadpisanie @wzmianki dla grupy; jawne identyfikatory dopuszczają też grupę w trybie listy dozwolonych | odziedziczone                        |
| `channels.feishu.groups.<chat_id>.enabled`               | Włącz/wyłącz określoną grupę                                                     | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Włącz automatyczne tworzenie agenta dla użytkownika                              | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Szablon ścieżki dla dynamicznych przestrzeni roboczych agenta                    | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Szablon nazwy katalogu agenta                                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maksymalna liczba dynamicznych agentów do utworzenia                             | nieograniczone                       |
| `channels.feishu.textChunkLimit`                         | Rozmiar fragmentu wiadomości                                                     | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Limit rozmiaru multimediów                                                       | `30`                                 |
| `channels.feishu.streaming`                              | Wyjście karty strumieniowej                                                      | `true`                               |
| `channels.feishu.blockStreaming`                         | Strumieniowanie odpowiedzi zakończonego bloku                                    | `false`                              |
| `channels.feishu.typingIndicator`                        | Wysyłaj reakcje pisania                                                          | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Rozwiązuj wyświetlane nazwy nadawców                                             | `true`                               |
| `channels.feishu.tools.bitable`                          | Włącz narzędzia Bitable/Base                                                     | `true`                               |
| `channels.feishu.tools.base`                             | Alias dla `channels.feishu.tools.bitable`; jawne `bitable` wygrywa, gdy oba są ustawione | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Bramka narzędzi Bitable/Base dla konta                                           | odziedziczone                        |
| `channels.feishu.accounts.<id>.tools.base`               | Alias dla konta dla `tools.bitable`                                              | odziedziczone                        |

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

Przychodzące wiadomości audio Feishu/Lark są normalizowane jako placeholdery multimediów zamiast surowego JSON `file_key`. Gdy skonfigurowano `tools.media.audio`, OpenClaw pobiera zasób notatki głosowej i uruchamia współdzieloną transkrypcję audio przed turą agenta, więc agent otrzymuje transkrypt mowy. Jeśli Feishu dołącza tekst transkrypcji bezpośrednio w ładunku audio, ten tekst jest używany bez kolejnego wywołania ASR. Bez dostawcy transkrypcji audio agent nadal otrzymuje placeholder `<media:audio>` oraz zapisany załącznik, a nie surowy ładunek zasobu Feishu.

### Wysyłanie

- ✅ Tekst
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/media
- ✅ Karty interaktywne (w tym aktualizacje strumieniowe)
- ⚠️ Tekst sformatowany (formatowanie w stylu posta; nie obsługuje pełnych możliwości tworzenia treści Feishu/Lark)

Natywne dymki audio Feishu/Lark używają typu wiadomości Feishu `audio` i wymagają
przesłanych mediów Ogg/Opus (`file_type: "opus"`). Istniejące media `.opus` i `.ogg`
są wysyłane bezpośrednio jako natywne audio. MP3/WAV/M4A i inne prawdopodobne formaty audio są
transkodowane do 48 kHz Ogg/Opus za pomocą `ffmpeg` tylko wtedy, gdy odpowiedź wymaga dostarczenia głosu
(`audioAsVoice` / narzędzie wiadomości `asVoice`, w tym odpowiedzi TTS w formie notatek głosowych).
Zwykłe załączniki MP3 pozostają zwykłymi plikami. Jeśli brakuje `ffmpeg` lub
konwersja się nie powiedzie, OpenClaw wraca do załącznika plikowego i zapisuje powód w logach.

### Wątki i odpowiedzi

- ✅ Odpowiedzi w tekście
- ✅ Odpowiedzi w wątku
- ✅ Odpowiedzi z mediami pozostają świadome wątku podczas odpowiadania na wiadomość w wątku

Dla `groupSessionScope: "group_topic"` i `"group_topic_sender"` natywne
grupy tematów Feishu/Lark używają zdarzenia `thread_id` (`omt_*`) jako kanonicznego
klucza sesji tematu. Jeśli natywne zdarzenie rozpoczynające temat pomija `thread_id`, OpenClaw
uzupełnia je z Feishu przed przekierowaniem tury. Zwykłe odpowiedzi grupowe, które
OpenClaw przekształca w wątki, nadal używają identyfikatora wiadomości głównej odpowiedzi (`om_*`), dzięki czemu
pierwsza tura i kolejna tura pozostają w tej samej sesji.

---

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
