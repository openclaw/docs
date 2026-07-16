---
read_when:
    - Chcesz połączyć bota Feishu/Lark
    - Konfigurujesz kanał Feishu
summary: Omówienie, funkcje i konfiguracja bota Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-16T17:57:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw łączy się z Feishu/Lark (kompleksową platformą współpracy) za pośrednictwem oficjalnego pluginu `@openclaw/feishu`: wiadomości prywatne z botem, czaty grupowe, strumieniowe odpowiedzi w kartach oraz narzędzia Feishu do dokumentów, wiki, dysku i Bitable.

**Stan:** gotowe do użytku produkcyjnego w przypadku wiadomości prywatnych z botem i czatów grupowych. WebSocket jest domyślnym transportem zdarzeń (publiczny adres URL nie jest wymagany); tryb webhooka jest opcjonalny.

## Szybki start

<Note>
Wymaga OpenClaw 2026.5.29 lub nowszej wersji. Uruchom `openclaw --version`, aby sprawdzić wersję. Zaktualizuj za pomocą `openclaw update`.
</Note>

<Steps>
  <Step title="Uruchom kreator konfiguracji kanału">
  ```bash
  openclaw channels login --channel feishu
  ```
  Spowoduje to zainstalowanie pluginu `@openclaw/feishu`, jeśli go brakuje, a następnie przeprowadzenie przez konfigurację:

- **Konfiguracja ręczna**: wklej App ID i App Secret z Feishu Open Platform (`https://open.feishu.cn`) lub Lark Developer (`https://open.larksuite.com`).
- **Konfiguracja za pomocą kodu QR**: zeskanuj kod QR w aplikacji Feishu, aby automatycznie utworzyć bota. Ten proces ogranicza wiadomości prywatne do własnego konta (`dmPolicy: "allowlist"` z własnym `open_id`).

Kreator zapyta również o domenę API (Feishu lub Lark) oraz zasady grup. Jeśli krajowa aplikacja mobilna Feishu nie reaguje na kod QR, uruchom konfigurację ponownie i wybierz konfigurację ręczną.
</Step>

  <Step title="Po zakończeniu konfiguracji uruchom ponownie Gateway, aby zastosować zmiany">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Kontrola dostępu

### Wiadomości prywatne

Skonfiguruj `channels.feishu.dmPolicy` (domyślnie: `pairing`), aby określić, kto może wysyłać botowi wiadomości prywatne:

| Wartość         | Zachowanie                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Nieznani użytkownicy otrzymują kod parowania; zatwierdzenie odbywa się przez CLI                                                         |
| `"allowlist"` | Rozmawiać mogą tylko użytkownicy wymienieni w `allowFrom`                                                                     |
| `"open"`      | Publiczne wiadomości prywatne; walidacja konfiguracji wymaga, aby `allowFrom` zawierało `"*"`. Wpisy inne niż symbole wieloznaczne nadal zawężają dostęp |

**Zatwierdzanie żądania parowania:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Czaty grupowe

**Zasady grup** (`channels.feishu.groupPolicy`, domyślnie: `allowlist`):

| Wartość         | Zachowanie                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Odpowiadanie na wszystkie wiadomości w grupach                                                            |
| `"allowlist"` | Odpowiadanie tylko w grupach wymienionych w `groupAllowFrom` lub jawnie skonfigurowanych w `groups.<chat_id>` |
| `"disabled"`  | Wyłączenie wszystkich wiadomości grupowych; jawne wpisy `groups.<chat_id>` nie zastępują tego ustawienia         |

**Wymóg wzmianki** (`channels.feishu.requireMention`):

- Domyślnie: wymagana jest @wzmianka, z wyjątkiem sytuacji, gdy obowiązującą zasadą grup jest `"open"`; wtedy wartością domyślną jest `false`, dzięki czemu wiadomości, które nie mogą zawierać wzmianek (na przykład obrazy), nadal docierają do agenta.
- Aby zastąpić to ustawienie, jawnie ustaw `true` lub `false`; ustawienie dla poszczególnych grup: `channels.feishu.groups.<chat_id>.requireMention`.
- Wzmianki służące wyłącznie do rozgłaszania, `@all` i `@_all`, nie są traktowane jako wzmianki o bocie. Wiadomość zawierająca zarówno wzmiankę `@all`, jak i bezpośrednią wzmiankę o bocie nadal jest uznawana za wzmiankę o bocie.

## Przykłady konfiguracji grup

### Zezwalanie na wszystkie grupy bez wymagania @wzmianki

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention ma domyślnie wartość false przy ustawieniu "open"
    },
  },
}
```

### Zezwalanie na wszystkie grupy z nadal wymaganą @wzmianką

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

### Zezwalanie tylko na określone grupy

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Identyfikatory grup mają postać: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

W trybie `allowlist` można również dopuścić grupę, dodając jawny wpis `groups.<chat_id>`. Jawne wpisy nie zastępują `groupPolicy: "disabled"`. Domyślne ustawienia z symbolem wieloznacznym w `groups.*` konfigurują pasujące grupy, ale same ich nie dopuszczają.

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

### Ograniczanie nadawców w grupie

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Identyfikatory open_id użytkowników mają postać: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` ustawia tę samą listę dozwolonych nadawców dla wszystkich grup; ustawienie `allowFrom` dla konkretnej grupy ma pierwszeństwo.

<a id="get-groupuser-ids"></a>

## Uzyskiwanie identyfikatorów grup i użytkowników

### Identyfikatory grup (`chat_id`, format: `oc_xxx`)

Otwórz grupę w Feishu/Lark, kliknij ikonę menu w prawym górnym rogu i przejdź do **Settings**. Identyfikator grupy (`chat_id`) znajduje się na stronie ustawień.

![Uzyskiwanie identyfikatora grupy](/images/feishu-get-group-id.png)

### Identyfikatory użytkowników (`open_id`, format: `ou_xxx`)

Uruchom Gateway, wyślij botowi wiadomość prywatną, a następnie sprawdź dzienniki:

```bash
openclaw logs --follow
```

W danych wyjściowych dziennika wyszukaj `open_id`. Można również sprawdzić oczekujące żądania parowania:

```bash
openclaw pairing list feishu
```

## Typowe polecenia

| Polecenie   | Opis                 |
| --------- | --------------------------- |
| `/status` | Wyświetla stan bota             |
| `/reset`  | Resetuje bieżącą sesję   |
| `/model`  | Wyświetla lub przełącza model AI |

<Note>
Feishu/Lark nie obsługuje natywnych menu poleceń rozpoczynających się ukośnikiem, dlatego należy wysyłać te polecenia jako zwykłe wiadomości tekstowe.
</Note>

## Rozwiązywanie problemów

### Bot nie odpowiada na czatach grupowych

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że użyto @wzmianki o bocie (domyślnie wymagane)
3. Sprawdź, czy `groupPolicy` nie ma wartości `"disabled"`
4. Sprawdź dzienniki: `openclaw logs --follow`

### Bot nie otrzymuje wiadomości

1. Upewnij się, że bot został opublikowany i zatwierdzony w Feishu Open Platform / Lark Developer
2. Upewnij się, że subskrypcja zdarzeń obejmuje `im.message.receive_v1`
3. Upewnij się, że wybrano **persistent connection** (WebSocket)
4. Upewnij się, że przyznano wszystkie wymagane zakresy uprawnień
5. Upewnij się, że Gateway działa: `openclaw gateway status`
6. Sprawdź dzienniki: `openclaw logs --follow`

### Konfiguracja za pomocą kodu QR nie wywołuje reakcji w aplikacji mobilnej Feishu

1. Uruchom konfigurację ponownie: `openclaw channels login --channel feishu`
2. Wybierz konfigurację ręczną
3. W Feishu Open Platform utwórz aplikację własną i skopiuj jej App ID oraz App Secret
4. Wklej te dane uwierzytelniające w kreatorze konfiguracji

### Wyciek App Secret

1. Zresetuj App Secret w Feishu Open Platform / Lark Developer
2. Zaktualizuj wartość w konfiguracji
3. Uruchom ponownie Gateway: `openclaw gateway restart`

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
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
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

`defaultAccount` określa, które konto jest używane, gdy wychodzące interfejsy API nie podają `accountId`. Wpisy kont dziedziczą ustawienia najwyższego poziomu; większość kluczy najwyższego poziomu można zastąpić dla poszczególnych kont.
`accounts.<id>.tts` ma taką samą strukturę jak `messages.tts` i jest głęboko scalane z globalną konfiguracją TTS, dzięki czemu konfiguracje Feishu z wieloma botami mogą przechowywać wspólne dane uwierzytelniające dostawców globalnie, zastępując dla poszczególnych kont tylko głos, model, personę lub tryb automatyczny.

### Limity wiadomości

- `textChunkLimit` — rozmiar fragmentu tekstu wychodzącego (domyślnie: `4000` znaków)
- `streaming.chunkMode` — `"length"` (domyślnie) dzieli tekst po osiągnięciu limitu; `"newline"` preferuje granice nowych wierszy
- `mediaMaxMb` — limit wysyłania i pobierania multimediów (domyślnie: `30` MB)

### Przesyłanie strumieniowe

Feishu/Lark obsługuje odpowiedzi strumieniowe za pomocą kart interaktywnych (interfejs API przesyłania strumieniowego Card Kit). Po włączeniu bot aktualizuje kartę w czasie rzeczywistym podczas generowania tekstu.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // strumieniowe dane wyjściowe w karcie (domyślnie: "partial")
        block: { enabled: true }, // włącza przesyłanie strumieniowe ukończonych bloków
      },
    },
  },
}
```

Ustaw `streaming.mode: "off"`, aby wysyłać pełną odpowiedź w jednej wiadomości; `renderMode: "raw"` (zwykły tekst zamiast kart) również wyłącza karty strumieniowe. `streaming.block.enabled` jest domyślnie wyłączone; należy je włączyć tylko wtedy, gdy ukończone bloki asystenta mają być wysyłane przed odpowiedzią końcową. Starsza wartość logiczna `streaming` oraz płaskie klucze `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` są migrowane do tej zagnieżdżonej struktury za pomocą `openclaw doctor --fix`.

### Optymalizacja limitu użycia

Liczbę wywołań interfejsu API Feishu/Lark można ograniczyć za pomocą dwóch opcjonalnych flag:

- `typingIndicator` (domyślnie `true`): ustaw `false`, aby pomijać wywołania reakcji sygnalizującej pisanie
- `resolveSenderNames` (domyślnie `true`): ustaw `false`, aby pomijać wyszukiwanie profilu nadawcy

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

### Zakres sesji grupowej i wątki tematyczne

`channels.feishu.groupSessionScope` (na najwyższym poziomie, dla poszczególnych kont lub grup) określa sposób mapowania wiadomości grupowych na sesje agenta:

| Wartość                  | Sesja                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (domyślnie)    | Jedna sesja na czat grupowy                                       |
| `"group_sender"`       | Jedna sesja na każdą parę (grupa + nadawca)                                 |
| `"group_topic"`        | Jedna sesja na wątek tematyczny; w razie braku używana jest sesja grupowa    |
| `"group_topic_sender"` | Jedna sesja na każdą parę (temat + nadawca); w razie braku używana jest para (grupa + nadawca) |

W przypadku zakresów tematycznych natywne grupy tematyczne Feishu/Lark używają zdarzenia `thread_id` (`omt_*`) jako kanonicznego klucza sesji tematu. Jeśli natywne zdarzenie rozpoczynające temat nie zawiera `thread_id`, OpenClaw pobiera tę wartość z Feishu przed przekierowaniem tury. Zwykłe odpowiedzi grupowe przekształcane przez OpenClaw w wątki nadal używają identyfikatora wiadomości głównej odpowiedzi (`om_*`), dzięki czemu pierwsza i kolejne tury pozostają w tej samej sesji.

Ustaw `replyInThread: "enabled"` (na najwyższym poziomie lub dla poszczególnych grup), aby odpowiedzi bota tworzyły lub kontynuowały wątek tematyczny Feishu zamiast odpowiadać bezpośrednio. `topicSessionMode` jest przestarzałym poprzednikiem `groupSessionScope`; preferowane jest `groupSessionScope`.

### Narzędzia przestrzeni roboczej Feishu

Plugin zawiera narzędzia agenta do dokumentów Feishu, czatów, bazy wiedzy, pamięci masowej w chmurze, uprawnień i Bitable, a także odpowiadające im Skills (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Rodziny narzędzi są kontrolowane przez `channels.feishu.tools`:

| Klucz           | Narzędzia                                     | Domyślnie           |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | Operacje na dokumentach `feishu_doc`              | `true`              |
| `tools.chat`    | Informacje o czacie `feishu_chat` i zapytania o członków      | `true`              |
| `tools.wiki`    | Baza wiedzy `feishu_wiki` (wymaga `doc`) | `true`              |
| `tools.drive`   | Przechowywanie w chmurze `feishu_drive`                  | `true`              |
| `tools.perm`    | Zarządzanie uprawnieniami `feishu_perm`           | `false` (wrażliwe) |
| `tools.scopes`  | Diagnostyka zakresów aplikacji `feishu_app_scopes`     | `true`              |
| `tools.bitable` | Operacje Bitable/Base `feishu_bitable_*`    | `true`              |

`tools.base` jest aliasem `tools.bitable`; gdy ustawiono obie wartości, pierwszeństwo ma jawna wartość `bitable`. Ograniczenia dla poszczególnych kont znajdują się w `accounts.<id>.tools`.

Należy przyznać `drive:drive.metadata:readonly` na potrzeby bezpośrednich wyszukiwań `feishu_drive info` poza katalogiem głównym,
chyba że aplikacja ma już pełny zakres `drive:drive`. Bez żadnego z tych zakresów `info`
zachowuje dotychczasowe wyszukiwanie w katalogu głównym dostępne przez `drive:drive:readonly`.

### Sesje ACP

Feishu/Lark obsługuje ACP dla wiadomości prywatnych i wiadomości w wątkach grupowych. ACP w Feishu/Lark jest sterowane poleceniami tekstowymi — nie ma natywnych menu poleceń z ukośnikiem, dlatego wiadomości `/acp ...` należy wpisywać bezpośrednio w rozmowie.

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

`--thread here` działa w wiadomościach prywatnych i wiadomościach w wątkach Feishu/Lark. Kolejne wiadomości w powiązanej rozmowie są kierowane bezpośrednio do tej sesji ACP.

### Kierowanie do wielu agentów

Należy użyć `bindings`, aby kierować wiadomości prywatne lub grupy Feishu/Lark do różnych agentów.

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

Pola kierowania:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (wiadomość prywatna) lub `"group"` (czat grupowy)
- `match.peer.id`: identyfikator Open ID użytkownika (`ou_xxx`) lub identyfikator grupy (`oc_xxx`)

Wskazówki dotyczące wyszukiwania zawiera sekcja [Uzyskiwanie identyfikatorów grup i użytkowników](#get-groupuser-ids).

## Izolacja agenta dla każdego użytkownika (dynamiczne tworzenie agentów)

Należy włączyć `dynamicAgentCreation`, aby automatycznie tworzyć **izolowane instancje agentów** dla każdego użytkownika wiadomości prywatnych. Każdy użytkownik otrzymuje własne:

- Niezależny katalog przestrzeni roboczej
- Oddzielne `USER.md` / `SOUL.md` / `MEMORY.md`
- Prywatną historię rozmów
- Izolowane umiejętności i stan

Jest to niezbędne w przypadku publicznych botów, gdy każdy użytkownik ma korzystać z własnego, prywatnego asystenta AI.

<Note>
Dynamiczne powiązania zawierają znormalizowane `accountId` Feishu, dzięki czemu konta domyślne i nazwane kierują każdego nadawcę do właściwego dynamicznego agenta.

Jeśli nazwane konto utworzyło we wcześniejszej wersji dynamicznego agenta bez zakresu, ten dotychczasowy agent nadal wlicza się do `maxAgents`. Przed jego usunięciem należy potwierdzić, że konto domyślne go nie używa, lub tymczasowo zwiększyć `maxAgents`; OpenClaw nie może bezpiecznie ustalić, do którego konta należy niejednoznaczny dotychczasowy stan.
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
    // Kluczowe: ustawia wiadomości prywatne każdego użytkownika jako jego „sesję główną”
    // Automatycznie wczytuje USER.md / SOUL.md / MEMORY.md
    // Aby uzyskać silniejszą izolację, należy zamiast tego użyć "per-channel-peer"
    dmScope: "main",
  },
}
```

### Jak to działa

Gdy nowy użytkownik wysyła pierwszą wiadomość prywatną:

1. Kanał generuje unikatowy `agentId`: `feishu-{user_open_id}` dla konta domyślnego albo ograniczony skrót tożsamości z prefiksem konta dla konta nazwanego
2. Tworzy nową przestrzeń roboczą w ścieżce `workspaceTemplate`
3. Rejestruje agenta i tworzy powiązanie dla tego użytkownika
4. Przy pierwszym dostępie pomocnik przestrzeni roboczej zapewnia obecność plików inicjalizacyjnych (`AGENTS.md`, `SOUL.md`, `USER.md` itd.)
5. Kieruje wszystkie przyszłe wiadomości tego użytkownika do jego dedykowanego agenta

### Opcje konfiguracji

| Ustawienie                                               | Opis                                       | Domyślnie                            |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Włącza automatyczne tworzenie agenta dla każdego użytkownika | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Szablon ścieżki przestrzeni roboczych dynamicznych agentów | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Szablon nazwy katalogu agenta              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maksymalna liczba dynamicznych agentów do utworzenia | bez ograniczeń                       |

Zmienne szablonu:

- `{agentId}` — wygenerowany identyfikator agenta (np. `feishu-ou_xxxxxx` lub `feishu-support-<identity_digest>`)
- `{userId}` — identyfikator open_id nadawcy w Feishu (np. `ou_xxxxxx`)

### Zakres sesji

`session.dmScope` określa sposób mapowania wiadomości prywatnych na sesje agentów. Jest to **ustawienie globalne**, które wpływa na wszystkie kanały.

| Wartość                      | Zachowanie                                                          | Najlepsze zastosowanie                                               |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Wiadomości prywatne każdego użytkownika są mapowane na główną sesję jego agenta | Boty dla jednego użytkownika, w których `USER.md` / `SOUL.md` mają być wczytywane automatycznie |
| `"per-peer"`                 | Każdy rozmówca otrzymuje oddzielną sesję (niezależnie od kanału)    | Izolacja oparta wyłącznie na tożsamości nadawcy                     |
| `"per-channel-peer"`         | Każda kombinacja (kanał + użytkownik) otrzymuje oddzielną sesję     | Publiczne boty dla wielu użytkowników wymagające silniejszej izolacji |
| `"per-account-channel-peer"` | Każda kombinacja (konto + kanał + użytkownik) otrzymuje oddzielną sesję | Boty obsługujące wiele kont, wymagające izolacji sesji na poziomie konta |

**Kompromis**: użycie `"main"` umożliwia automatyczne wczytywanie plików inicjalizacyjnych (`USER.md`, `SOUL.md`, `MEMORY.md`), ale oznacza, że wszystkie wiadomości prywatne we wszystkich kanałach korzystają z tego samego wzorca klucza sesji. W przypadku publicznych botów dla wielu użytkowników, w których izolacja jest ważniejsza niż automatyczne wczytywanie plików inicjalizacyjnych, warto rozważyć `"per-channel-peer"` i zarządzać plikami inicjalizacyjnymi ręcznie.

<Note>
Należy użyć `"per-account-channel-peer"`, gdy nazwane konta Feishu powinny utrzymywać oddzielne sesje dla tego samego nadawcy. Dynamiczne powiązania zachowują zakres konta.
</Note>

### Typowe wdrożenie dla wielu użytkowników

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
    // Wybierz dmScope zgodnie z potrzebami dotyczącymi izolacji:
    // "main" zapewnia automatyczne wczytywanie plików inicjalizacyjnych, a "per-channel-peer" silniejszą izolację
    dmScope: "main",
  },
  bindings: [], // Puste — dynamiczni agenci tworzą powiązania automatycznie
}
```

### Weryfikacja

Należy sprawdzić dzienniki Gateway, aby potwierdzić, że dynamiczne tworzenie działa:

```text
feishu: tworzenie dynamicznego agenta "feishu-ou_xxxxxx" dla użytkownika ou_xxxxxx
  przestrzeń robocza: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  katalog agenta: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Wyświetlenie wszystkich utworzonych przestrzeni roboczych:

```bash
ls -la ~/.openclaw/workspace-*
```

### Uwagi

- **Izolacja przestrzeni roboczej**: każdy użytkownik otrzymuje własny katalog przestrzeni roboczej i instancję agenta. W normalnym przepływie wiadomości użytkownicy nie mogą przeglądać historii rozmów ani plików innych użytkowników.
- **Granica bezpieczeństwa**: jest to mechanizm izolacji kontekstu wiadomości, a nie granica bezpieczeństwa chroniąca przed wrogimi współdzierżawcami. Proces agenta i środowisko hosta są współdzielone.
- **Zapisywanie konfiguracji musi pozostać włączone**: dynamiczne tworzenie agentów zapisuje agentów i powiązania w konfiguracji; jest pomijane, gdy `channels.feishu.configWrites` ma wartość `false` (domyślnie: włączone).
- **`bindings` powinno być puste**: dynamiczni agenci automatycznie rejestrują własne powiązania
- **Ścieżka uaktualnienia**: istniejące ręczne powiązania nadal działają równolegle z dynamicznymi agentami
- **`session.dmScope` jest globalne**: wpływa to na wszystkie kanały, nie tylko Feishu

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/pl/gateway/configuration)

| Ustawienie                                                  | Opis                                                                          | Wartość domyślna                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Włącza/wyłącza kanał                                                           | `true`                               |
| `channels.feishu.domain`                                 | Domena API (`feishu`, `lark` lub bazowy adres URL `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transport zdarzeń (`websocket` lub `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Domyślne konto do routingu wychodzącego                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | Wymagane w trybie webhooka                                                            | -                                    |
| `channels.feishu.encryptKey`                             | Wymagane w trybie webhooka                                                            | -                                    |
| `channels.feishu.webhookPath`                            | Ścieżka routingu webhooka                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host nasłuchiwania webhooka                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Port nasłuchiwania webhooka                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | Identyfikator aplikacji                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Sekret aplikacji                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Nadpisanie domeny dla konta                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Nadpisanie TTS dla konta                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Zasady wiadomości prywatnych (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | Lista dozwolonych nadawców wiadomości prywatnych (lista open_id)                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | Zasady grup (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Lista dozwolonych grup                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Lista dozwolonych nadawców stosowana we wszystkich grupach                                               | -                                    |
| `channels.feishu.requireMention`                         | Wymaga wzmianki @ w grupach                                                           | `true` (`false`, gdy zasada to `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | Nadpisanie wymogu wzmianki @ dla grupy; jawne identyfikatory także dopuszczają grupę w trybie listy dozwolonych     | dziedziczone                            |
| `channels.feishu.groups.<chat_id>.enabled`               | Włącza/wyłącza określoną grupę                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Lista dozwolonych nadawców dla grupy (nadpisuje `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | Mapowanie sesji grupowych (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Odpowiedzi bota tworzą lub kontynuują wątki tematyczne (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Zdarzenia reakcji przychodzących (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Włącza automatyczne tworzenie agentów dla poszczególnych użytkowników                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Szablon ścieżki obszarów roboczych agentów dynamicznych                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Szablon nazwy katalogu agenta                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maksymalna liczba agentów dynamicznych do utworzenia                                           | bez ograniczeń                            |
| `channels.feishu.textChunkLimit`                         | Rozmiar fragmentu wiadomości                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Dzielenie na fragmenty (`length` lub `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Limit rozmiaru multimediów                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | Renderowanie odpowiedzi (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | Strumieniowe wysyłanie kart (`partial` lub `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Strumieniowe wysyłanie odpowiedzi w ukończonych blokach                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | Wysyła reakcje informujące o pisaniu                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Ustala wyświetlane nazwy nadawców                                                         | `true`                               |
| `channels.feishu.configWrites`                           | Zezwala kanałowi na zapisywanie konfiguracji (wymagane przez agentów dynamicznych)                     | `true`                               |
| `channels.feishu.tools.doc`                              | Włącza narzędzia dokumentów                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | Włącza narzędzia informacji o czacie                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | Włącza narzędzia bazy wiedzy (wymaga `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | Włącza narzędzia pamięci masowej w chmurze                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | Włącza narzędzia do zarządzania uprawnieniami                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | Włącza narzędzie diagnostyczne zakresów aplikacji                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | Włącza narzędzia Bitable/Base                                                            | `true`                               |
| `channels.feishu.tools.base`                             | Alias dla `channels.feishu.tools.bitable`; jawne ustawienie `bitable` ma pierwszeństwo, gdy ustawiono oba     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Przełącznik narzędzi Bitable/Base dla konta                                                   | dziedziczone                            |
| `channels.feishu.accounts.<id>.tools.base`               | Alias `tools.bitable` dla konta                                                | dziedziczone                            |

## Obsługiwane typy wiadomości

### Odbieranie

- ✅ Tekst
- ✅ Tekst sformatowany (post)
- ✅ Obrazy
- ✅ Pliki
- ✅ Dźwięk
- ✅ Wideo/multimedia
- ✅ Naklejki

Przychodzące wiadomości dźwiękowe Feishu/Lark są normalizowane jako symbole zastępcze multimediów zamiast
surowych danych JSON `file_key`. Gdy skonfigurowano `tools.media.audio`, OpenClaw
pobiera zasób notatki głosowej i przed turą agenta uruchamia współdzieloną transkrypcję dźwięku,
dzięki czemu agent otrzymuje transkrypcję wypowiedzi. Jeśli Feishu umieszcza
tekst transkrypcji bezpośrednio w ładunku dźwiękowym, jest on używany bez kolejnego
wywołania ASR. Bez dostawcy transkrypcji dźwięku agent nadal otrzymuje
symbol zastępczy `<media:audio>` wraz z zapisanym załącznikiem, a nie surowy ładunek
zasobu Feishu.

### Wysyłanie

- ✅ Tekst
- ✅ Obrazy
- ✅ Pliki
- ✅ Dźwięk
- ✅ Wideo/multimedia
- ✅ Karty interaktywne (w tym aktualizacje strumieniowe)
- ⚠️ Tekst sformatowany (formatowanie w stylu postu; nie obsługuje wszystkich możliwości tworzenia treści Feishu/Lark)

Natywne dymki dźwiękowe Feishu/Lark używają typu wiadomości Feishu `audio` i wymagają
przesłania multimediów Ogg/Opus (`file_type: "opus"`). Istniejące multimedia `.opus` i `.ogg`
są wysyłane bezpośrednio jako natywny dźwięk. Pliki MP3/WAV/M4A i inne prawdopodobne formaty dźwiękowe są
transkodowane do Ogg/Opus 48 kHz za pomocą `ffmpeg` tylko wtedy, gdy odpowiedź wymaga dostarczenia
głosowego (`audioAsVoice` / narzędzie wiadomości `asVoice`, w tym odpowiedzi TTS jako notatki
głosowe). Zwykłe załączniki MP3 pozostają zwykłymi plikami. Jeśli brakuje `ffmpeg` lub
konwersja się nie powiedzie, OpenClaw używa załącznika plikowego i zapisuje przyczynę w dzienniku.

### Wątki i odpowiedzi

- ✅ Odpowiedzi w tekście
- ✅ Odpowiedzi w wątkach
- ✅ Odpowiedzi multimedialne zachowują powiązanie z wątkiem podczas odpowiadania na wiadomość w wątku

Routing sesji grup tematycznych opisano w sekcji
[Zakres sesji grupowej i wątki tematyczne](#group-session-scope-and-topic-threads).

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie wiadomości prywatnych i proces parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i wymaganie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
