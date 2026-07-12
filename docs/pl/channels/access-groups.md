---
read_when:
    - Konfigurowanie tej samej listy dozwolonych elementów w wielu kanałach wiadomości
    - Udostępnianie reguł dostępu dla nadawców wiadomości prywatnych i grupowych
    - Przegląd kontroli dostępu do kanałów wiadomości
summary: Listy dozwolonych nadawców wielokrotnego użytku dla kanałów wiadomości
title: Grupy dostępu
x-i18n:
    generated_at: "2026-07-12T14:52:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Grupy dostępu to nazwane listy nadawców, które definiujesz raz w `accessGroups`, a następnie przywołujesz na listach dozwolonych kanałów za pomocą `accessGroup:<name>`.

Używaj ich, gdy te same osoby powinny mieć dostęp w kilku kanałach wiadomości lub gdy jeden zaufany zbiór ma służyć zarówno do autoryzacji wiadomości prywatnych, jak i nadawców w grupach.

Sama grupa nie przyznaje żadnych uprawnień. Ma znaczenie tylko wtedy, gdy odwołuje się do niej pole listy dozwolonych.

## Statyczne grupy nadawców wiadomości

Statyczne grupy nadawców używają `type: "message.senders"`. Klucze w `members` są identyfikatorami kanałów wiadomości, a `"*"` oznacza wpisy wspólne dla wszystkich kanałów:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

| Klucz                      | Znaczenie                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `"*"`                      | Wspólne wpisy sprawdzane dla każdego kanału wiadomości, który odwołuje się do grupy.         |
| `discord`, `telegram`, ... | Wpisy sprawdzane tylko podczas dopasowywania listy dozwolonych dla danego kanału.            |

Wpisy są dopasowywane zgodnie ze standardowymi regułami `allowFrom` kanału docelowego. OpenClaw nie przekształca identyfikatorów nadawców między kanałami: jeśli Alicja ma identyfikator Telegram i identyfikator Discord, umieść oba identyfikatory pod odpowiednimi kluczami kanałów.

## Odwoływanie się do grup z list dozwolonych

Odwołuj się do grupy za pomocą `accessGroup:<name>` wszędzie tam, gdzie ścieżka kanału wiadomości obsługuje listy dozwolonych nadawców.

Przykład listy dozwolonych dla wiadomości prywatnych:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Przykład listy dozwolonych nadawców w grupie:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Możesz łączyć grupy z wpisami bezpośrednimi:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Obsługiwane ścieżki kanałów wiadomości

Grupy dostępu działają we współdzielonych ścieżkach autoryzacji kanałów wiadomości:

- listach dozwolonych nadawców wiadomości prywatnych, takich jak `channels.<channel>.allowFrom`
- listach dozwolonych nadawców grupowych, takich jak `channels.<channel>.groupAllowFrom`
- listach dozwolonych nadawców dla poszczególnych pomieszczeń danego kanału, które korzystają z tych samych reguł dopasowywania nadawców (na przykład `groups.<space>.users` w Google Chat)
- ścieżkach autoryzacji poleceń, które ponownie wykorzystują listy dozwolonych nadawców kanałów wiadomości

Obsługa zależy od tego, czy dany kanał korzysta ze współdzielonych mechanizmów pomocniczych OpenClaw do autoryzacji nadawców. Obecna wbudowana obsługa obejmuje ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo i Zalo Personal. Statyczne grupy `message.senders` są niezależne od kanału, dlatego nowe kanały wiadomości uzyskują ich obsługę, gdy używają współdzielonych mechanizmów wejściowych SDK pluginu zamiast niestandardowego rozwijania list dozwolonych.

## Odbiorcy kanału Discord

Discord obsługuje również dynamiczny typ grupy dostępu:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` oznacza „zezwalaj na wiadomości prywatne od nadawców Discord, którzy obecnie mogą wyświetlać ten kanał serwera”. OpenClaw rozpoznaje nadawcę za pośrednictwem Discord w momencie autoryzacji i stosuje reguły uprawnienia Discord `ViewChannel`. Pole `membership` jest opcjonalne, a jego wartość domyślna to `canViewChannel`.

Użyj tego rozwiązania, gdy kanał Discord jest już źródłem prawdy dla zespołu, na przykład `#maintainers` lub `#on-call`.

Wymagania i zachowanie w razie błędów:

- Bot musi mieć dostęp do serwera i kanału.
- Bot wymaga opcji **Server Members Intent** w Discord Developer Portal.
- Grupa dostępu domyślnie odmawia dostępu, gdy Discord zwróci `Missing Access`, nie można rozpoznać nadawcy jako członka serwera lub kanał należy do innego serwera.

Więcej przykładów dotyczących Discord: [Kontrola dostępu Discord](/pl/channels/discord#access-control-and-routing)

## Diagnostyka pluginów

Autorzy pluginów mogą sprawdzać ustrukturyzowany stan grup dostępu bez ponownego rozwijania go do płaskiej listy dozwolonych:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Wynik zawiera informacje o grupach przywołanych, dopasowanych, brakujących, nieobsługiwanych i zakończonych błędem. Używaj go do diagnostyki lub testów zgodności. Funkcji `expandAllowFromWithAccessGroups(...)` używaj tylko w ścieżkach zgodności, które nadal oczekują płaskiej tablicy `allowFrom`.

## Uwagi dotyczące bezpieczeństwa

- Grupy dostępu są aliasami list dozwolonych, a nie rolami. Same nie tworzą właścicieli, nie zatwierdzają żądań parowania ani nie przyznają uprawnień do narzędzi.
- `dmPolicy: "open"` nadal wymaga `"*"` na efektywnej liście dozwolonych dla wiadomości prywatnych. Odwołanie do grupy dostępu nie jest równoznaczne z dostępem publicznym.
- Brakujące nazwy grup domyślnie skutkują odmową dostępu. Jeśli `allowFrom` zawiera `accessGroup:operators`, ale `accessGroups.operators` nie istnieje, ten wpis nie autoryzuje nikogo.
- Zachowuj stabilność identyfikatorów kanałów. Jeśli kanał obsługuje zarówno identyfikatory numeryczne lub użytkowników, jak i nazwy wyświetlane, preferuj identyfikatory.

## Rozwiązywanie problemów

Jeśli nadawca powinien zostać dopasowany, ale jest blokowany:

1. Potwierdź, że pole listy dozwolonych zawiera dokładne odwołanie `accessGroup:<name>`.
2. Potwierdź, że `accessGroups.<name>.type` ma prawidłową wartość.
3. Potwierdź, że identyfikator nadawcy znajduje się pod odpowiednim kluczem kanału lub pod `"*"`.
4. Potwierdź, że wpis używa standardowej składni listy dozwolonych danego kanału.
5. W przypadku odbiorców kanału Discord potwierdź, że bot widzi kanał serwera i ma włączoną opcję Server Members Intent.

Po zmianie konfiguracji kontroli dostępu uruchom `openclaw doctor`. Polecenie wykrywa wiele nieprawidłowych kombinacji list dozwolonych i zasad przed uruchomieniem.
