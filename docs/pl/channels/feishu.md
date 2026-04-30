---
read_when:
    - Chcesz połączyć bota Feishu/Lark
    - Konfigurujesz kanał Feishu
summary: Omówienie, funkcje i konfiguracja bota Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-30T09:36:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark to kompleksowa platforma do współpracy, na której zespoły czatują, udostępniają dokumenty, zarządzają kalendarzami i wspólnie wykonują pracę.

**Status:** gotowe do produkcji dla wiadomości bezpośrednich z botem i czatów grupowych. WebSocket jest trybem domyślnym; tryb webhook jest opcjonalny.

---

## Szybki start

<Note>
Wymaga OpenClaw 2026.4.25 lub nowszego. Uruchom `openclaw --version`, aby sprawdzić wersję. Zaktualizuj za pomocą `openclaw update`.
</Note>

<Steps>
  <Step title="Run the channel setup wizard">
  ```bash
  openclaw channels login --channel feishu
  ```
  Zeskanuj kod QR aplikacją mobilną Feishu/Lark, aby automatycznie utworzyć bota Feishu/Lark.
  </Step>
  
  <Step title="After setup completes, restart the gateway to apply the changes">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrola dostępu

### Wiadomości bezpośrednie

Skonfiguruj `dmPolicy`, aby kontrolować, kto może wysyłać wiadomości bezpośrednie do bota:

- `"pairing"` — nieznani użytkownicy otrzymują kod parowania; zatwierdź przez CLI
- `"allowlist"` — czatować mogą tylko użytkownicy wymienieni w `allowFrom` (domyślnie: tylko właściciel bota)
- `"open"` — zezwalaj na publiczne wiadomości bezpośrednie tylko wtedy, gdy `allowFrom` zawiera `"*"`; przy ograniczających wpisach czatować mogą tylko pasujący użytkownicy
- `"disabled"` — wyłącz wszystkie wiadomości bezpośrednie

**Zatwierdź żądanie parowania:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Czaty grupowe

**Polityka grup** (`channels.feishu.groupPolicy`):

| Wartość       | Zachowanie                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `"open"`      | Odpowiadaj na wszystkie wiadomości w grupach                                                    |
| `"allowlist"` | Odpowiadaj tylko grupom w `groupAllowFrom` lub jawnie skonfigurowanym w `groups.<chat_id>`      |
| `"disabled"`  | Wyłącz wszystkie wiadomości grupowe; jawne wpisy `groups.<chat_id>` tego nie nadpisują          |

Domyślnie: `allowlist`

**Wymóg wzmianki** (`channels.feishu.requireMention`):

- `true` — wymagaj @wzmianki (domyślnie)
- `false` — odpowiadaj bez @wzmianki
- Nadpisanie dla grupy: `channels.feishu.groups.<chat_id>.requireMention`
- Wzmianki rozgłoszeniowe `@all` i `@_all` nie są traktowane jako wzmianki o bocie. Wiadomość, która wspomina jednocześnie `@all` i bezpośrednio bota, nadal liczy się jako wzmianka o bocie.

---

## Przykłady konfiguracji grup

### Zezwól wszystkim grupom, bez wymogu @wzmianki

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

W trybie `allowlist` możesz też dopuścić grupę, dodając jawny wpis `groups.<chat_id>`. Jawne wpisy nie nadpisują `groupPolicy: "disabled"`. Domyślne wpisy z symbolem wieloznacznym w `groups.*` konfigurują pasujące grupy, ale same ich nie dopuszczają.

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

## Pobieranie identyfikatorów grup/użytkowników

### Identyfikatory grup (`chat_id`, format: `oc_xxx`)

Otwórz grupę w Feishu/Lark, kliknij ikonę menu w prawym górnym rogu i przejdź do **Ustawień**. Identyfikator grupy (`chat_id`) jest podany na stronie ustawień.

![Pobierz identyfikator grupy](/images/feishu-get-group-id.png)

### Identyfikatory użytkowników (`open_id`, format: `ou_xxx`)

Uruchom Gateway, wyślij wiadomość bezpośrednią do bota, a następnie sprawdź logi:

```bash
openclaw logs --follow
```

Poszukaj `open_id` w wyjściu logów. Możesz też sprawdzić oczekujące żądania parowania:

```bash
openclaw pairing list feishu
```

---

## Typowe polecenia

| Polecenie | Opis                            |
| --------- | ------------------------------- |
| `/status` | Pokaż status bota               |
| `/reset`  | Zresetuj bieżącą sesję          |
| `/model`  | Pokaż lub przełącz model AI     |

<Note>
Feishu/Lark nie obsługuje natywnych menu poleceń z ukośnikiem, więc wysyłaj je jako zwykłe wiadomości tekstowe.
</Note>

---

## Rozwiązywanie problemów

### Bot nie odpowiada w czatach grupowych

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że dodajesz @wzmiankę o bocie (domyślnie wymagane)
3. Sprawdź, czy `groupPolicy` nie ma wartości `"disabled"`
4. Sprawdź logi: `openclaw logs --follow`

### Bot nie odbiera wiadomości

1. Upewnij się, że bot jest opublikowany i zatwierdzony w Feishu Open Platform / Lark Developer
2. Upewnij się, że subskrypcja zdarzeń obejmuje `im.message.receive_v1`
3. Upewnij się, że wybrano **połączenie trwałe** (WebSocket)
4. Upewnij się, że przyznano wszystkie wymagane zakresy uprawnień
5. Upewnij się, że Gateway działa: `openclaw gateway status`
6. Sprawdź logi: `openclaw logs --follow`

### Wyciek App Secret

1. Zresetuj App Secret w Feishu Open Platform / Lark Developer
2. Zaktualizuj wartość w konfiguracji
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
`accounts.<id>.tts` używa tego samego kształtu co `messages.tts` i jest głęboko scalane z
globalną konfiguracją TTS, dzięki czemu konfiguracje Feishu z wieloma botami mogą przechowywać wspólne dane
uwierzytelniające dostawcy globalnie, nadpisując tylko głos, model, personę lub tryb automatyczny
dla każdego konta.

### Limity wiadomości

- `textChunkLimit` — rozmiar fragmentu tekstu wychodzącego (domyślnie: `2000` znaków)
- `mediaMaxMb` — limit przesyłania/pobierania multimediów (domyślnie: `30` MB)

### Strumieniowanie

Feishu/Lark obsługuje odpowiedzi strumieniowane przez karty interaktywne. Po włączeniu bot aktualizuje kartę w czasie rzeczywistym podczas generowania tekstu.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

Ustaw `streaming: false`, aby wysłać pełną odpowiedź w jednej wiadomości.

### Optymalizacja limitów

Zmniejsz liczbę wywołań API Feishu/Lark za pomocą dwóch opcjonalnych flag:

- `typingIndicator` (domyślnie `true`): ustaw `false`, aby pominąć wywołania reakcji pisania
- `resolveSenderNames` (domyślnie `true`): ustaw `false`, aby pominąć wyszukiwania profili nadawców

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

Feishu/Lark obsługuje ACP dla wiadomości bezpośrednich i wiadomości w wątkach grupowych. ACP w Feishu/Lark działa przez polecenia tekstowe — nie ma natywnych menu poleceń z ukośnikiem, więc używaj wiadomości `/acp ...` bezpośrednio w rozmowie.

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

W wiadomości bezpośredniej lub wątku Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` działa dla wiadomości bezpośrednich i wiadomości w wątkach Feishu/Lark. Kolejne wiadomości w powiązanej rozmowie trafiają bezpośrednio do tej sesji ACP.

### Routing wielu agentów

Użyj `bindings`, aby kierować wiadomości bezpośrednie lub grupy Feishu/Lark do różnych agentów.

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
- `match.peer.kind`: `"direct"` (wiadomość bezpośrednia) lub `"group"` (czat grupowy)
- `match.peer.id`: Open ID użytkownika (`ou_xxx`) lub identyfikator grupy (`oc_xxx`)

Wskazówki dotyczące wyszukiwania znajdziesz w [Pobieranie identyfikatorów grup/użytkowników](#get-groupuser-ids).

---

## Informacje o konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/pl/gateway/configuration)

| Ustawienie                                        | Opis                                                                                                          | Domyślnie        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Włącz/wyłącz kanał                                                                                            | `true`           |
| `channels.feishu.domain`                          | Domena API (`feishu` lub `lark`)                                                                              | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport zdarzeń (`websocket` lub `webhook`)                                                                 | `websocket`      |
| `channels.feishu.defaultAccount`                  | Domyślne konto dla routingu wychodzącego                                                                      | `default`        |
| `channels.feishu.verificationToken`               | Wymagane w trybie webhooka                                                                                    | —                |
| `channels.feishu.encryptKey`                      | Wymagane w trybie webhooka                                                                                    | —                |
| `channels.feishu.webhookPath`                     | Ścieżka trasy Webhook                                                                                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host wiązania Webhook                                                                                         | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port wiązania Webhook                                                                                         | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | Identyfikator aplikacji                                                                                       | —                |
| `channels.feishu.accounts.<id>.appSecret`         | Sekret aplikacji                                                                                              | —                |
| `channels.feishu.accounts.<id>.domain`            | Nadpisanie domeny dla konta                                                                                   | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Nadpisanie TTS dla konta                                                                                      | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Zasada wiadomości prywatnych                                                                                  | `allowlist`      |
| `channels.feishu.allowFrom`                       | Lista dozwolonych wiadomości prywatnych (lista open_id)                                                       | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Zasada grup                                                                                                   | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Lista dozwolonych grup                                                                                        | —                |
| `channels.feishu.requireMention`                  | Wymagaj @wzmianki w grupach                                                                                   | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Nadpisanie @wzmianki dla grupy; jawne identyfikatory dopuszczają też grupę w trybie listy dozwolonych         | odziedziczone    |
| `channels.feishu.groups.<chat_id>.enabled`        | Włącz/wyłącz konkretną grupę                                                                                  | `true`           |
| `channels.feishu.textChunkLimit`                  | Rozmiar fragmentu wiadomości                                                                                  | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limit rozmiaru multimediów                                                                                    | `30`             |
| `channels.feishu.streaming`                       | Strumieniowe wyjście kart                                                                                     | `true`           |
| `channels.feishu.blockStreaming`                  | Strumieniowanie na poziomie bloków                                                                            | `true`           |
| `channels.feishu.typingIndicator`                 | Wysyłaj reakcje pisania                                                                                       | `true`           |
| `channels.feishu.resolveSenderNames`              | Ustalaj wyświetlane nazwy nadawców                                                                            | `true`           |

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

Przychodzące wiadomości audio Feishu/Lark są normalizowane jako symbole zastępcze multimediów zamiast surowego JSON `file_key`. Gdy skonfigurowano `tools.media.audio`, OpenClaw pobiera zasób notatki głosowej i uruchamia współdzieloną transkrypcję audio przed turą agenta, dzięki czemu agent otrzymuje transkrypcję wypowiedzi. Jeśli Feishu zawiera tekst transkrypcji bezpośrednio w ładunku audio, ten tekst jest używany bez kolejnego wywołania ASR. Bez dostawcy transkrypcji audio agent nadal otrzymuje symbol zastępczy `<media:audio>` oraz zapisany załącznik, a nie surowy ładunek zasobu Feishu.

### Wysyłanie

- ✅ Tekst
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/multimedia
- ✅ Karty interaktywne (w tym aktualizacje strumieniowe)
- ⚠️ Tekst sformatowany (formatowanie w stylu post; nie obsługuje pełnych możliwości tworzenia Feishu/Lark)

Natywne dymki audio Feishu/Lark używają typu wiadomości `audio` Feishu i wymagają przesłanych multimediów Ogg/Opus (`file_type: "opus"`). Istniejące multimedia `.opus` i `.ogg` są wysyłane bezpośrednio jako natywne audio. MP3/WAV/M4A i inne prawdopodobne formaty audio są transkodowane do Ogg/Opus 48 kHz za pomocą `ffmpeg` tylko wtedy, gdy odpowiedź żąda dostarczenia głosem (`audioAsVoice` / narzędzie wiadomości `asVoice`, w tym odpowiedzi TTS w formie notatek głosowych). Zwykłe załączniki MP3 pozostają zwykłymi plikami. Jeśli brakuje `ffmpeg` albo konwersja się nie powiedzie, OpenClaw wraca do załącznika plikowego i zapisuje powód w logach.

### Wątki i odpowiedzi

- ✅ Odpowiedzi w wierszu
- ✅ Odpowiedzi w wątku
- ✅ Odpowiedzi z multimediami pozostają świadome wątku podczas odpowiadania na wiadomość w wątku

Dla `groupSessionScope: "group_topic"` i `"group_topic_sender"` natywne grupy tematów Feishu/Lark używają zdarzenia `thread_id` (`omt_*`) jako kanonicznego klucza sesji tematu. Zwykłe odpowiedzi grupowe, które OpenClaw zamienia w wątki, nadal używają identyfikatora wiadomości głównej odpowiedzi (`om_*`), dzięki czemu pierwsza tura i kolejna tura pozostają w tej samej sesji.

---

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i zabezpieczanie
