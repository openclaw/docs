---
read_when:
    - Konfigurowanie tej samej listy dozwolonych elementów w wielu kanałach wiadomości
    - Reguły dostępu nadawców w wiadomościach prywatnych i grupach dotyczące udostępniania
    - Przegląd kontroli dostępu do kanałów wiadomości
summary: Listy dozwolonych nadawców wielokrotnego użytku dla kanałów wiadomości
title: Grupy dostępu
x-i18n:
    generated_at: "2026-05-02T09:42:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Grupy dostępu to nazwane listy nadawców, które definiujesz raz i odwołujesz się do nich z list dozwolonych kanałów za pomocą `accessGroup:<name>`.

Używaj ich, gdy te same osoby powinny być dozwolone w kilku kanałach wiadomości albo gdy jeden zaufany zestaw powinien dotyczyć zarówno autoryzacji nadawców w wiadomościach prywatnych, jak i w grupach.

Grupy dostępu same nie przyznają dostępu. Grupa ma znaczenie tylko wtedy, gdy odwołuje się do niej pole listy dozwolonych.

## Statyczne grupy nadawców wiadomości

Statyczne grupy nadawców używają `type: "message.senders"`.

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

Listy członków są indeksowane według identyfikatora kanału wiadomości:

| Klucz      | Znaczenie                                                                 |
| ---------- | ------------------------------------------------------------------------- |
| `"*"`      | Wspólne wpisy sprawdzane dla każdego kanału wiadomości, który odwołuje się do grupy. |
| `discord`  | Wpisy sprawdzane tylko przy dopasowywaniu listy dozwolonych dla Discord.  |
| `telegram` | Wpisy sprawdzane tylko przy dopasowywaniu listy dozwolonych dla Telegram. |
| `whatsapp` | Wpisy sprawdzane tylko przy dopasowywaniu listy dozwolonych dla WhatsApp. |

Wpisy są dopasowywane zgodnie ze zwykłymi regułami `allowFrom` kanału docelowego. OpenClaw nie tłumaczy identyfikatorów nadawców między kanałami. Jeśli Alice ma identyfikator Telegram i identyfikator Discord, podaj oba identyfikatory pod odpowiednimi kluczami.

## Odwoływanie się do grup z list dozwolonych

Odwołaj się do grupy za pomocą `accessGroup:<name>` wszędzie tam, gdzie ścieżka kanału wiadomości obsługuje listy dozwolonych nadawców.

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

Przykład listy dozwolonych nadawców grupowych:

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
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Możesz łączyć grupy i bezpośrednie wpisy:

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

Grupy dostępu są dostępne we współdzielonych ścieżkach autoryzacji kanałów wiadomości, w tym:

- listach dozwolonych nadawców wiadomości prywatnych, takich jak `channels.<channel>.allowFrom`
- listach dozwolonych nadawców grupowych, takich jak `channels.<channel>.groupAllowFrom`
- specyficznych dla kanału listach dozwolonych nadawców dla poszczególnych pokojów, które używają tych samych reguł dopasowywania nadawców
- ścieżkach autoryzacji poleceń, które ponownie używają list dozwolonych nadawców kanałów wiadomości

Obsługa kanału zależy od tego, czy dany kanał jest podłączony przez współdzielonych pomocników autoryzacji nadawców OpenClaw. Obecnie wbudowana obsługa obejmuje Discord, Google Chat, Nostr, WhatsApp, Zalo i Zalo Personal. Statyczne grupy `message.senders` są zaprojektowane jako niezależne od kanału, więc nowe kanały wiadomości powinny je obsługiwać przez użycie współdzielonych pomocników SDK Plugin zamiast niestandardowego rozwijania list dozwolonych.

## Odbiorcy kanału Discord

Discord obsługuje też dynamiczny typ grupy dostępu:

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

`discord.channelAudience` oznacza „zezwalaj nadawcom wiadomości prywatnych Discord, którzy obecnie mogą wyświetlać ten kanał gildii”. OpenClaw rozwiązuje nadawcę przez Discord w czasie autoryzacji i stosuje reguły uprawnień Discord `ViewChannel`.

Użyj tego, gdy kanał Discord jest już źródłem prawdy dla zespołu, takim jak `#maintainers` albo `#on-call`.

Wymagania i zachowanie w razie niepowodzenia:

- Bot potrzebuje dostępu do gildii i kanału.
- Bot potrzebuje opcji **Server Members Intent** w Discord Developer Portal.
- Grupa dostępu nie zezwala na dostęp, gdy Discord zwraca `Missing Access`, nie można rozwiązać nadawcy jako członka gildii albo kanał należy do innej gildii.

Więcej przykładów specyficznych dla Discord: [Kontrola dostępu Discord](/pl/channels/discord#access-control-and-routing)

## Uwagi dotyczące bezpieczeństwa

- Grupy dostępu są aliasami list dozwolonych, a nie rolami. Same nie tworzą właścicieli, nie zatwierdzają próśb o parowanie ani nie przyznają uprawnień do narzędzi.
- `dmPolicy: "open"` nadal wymaga `"*"` na efektywnej liście dozwolonych dla wiadomości prywatnych. Odwołanie się do grupy dostępu nie jest tym samym co dostęp publiczny.
- Brakujące nazwy grup nie zezwalają na dostęp. Jeśli `allowFrom` zawiera `accessGroup:operators`, a `accessGroups.operators` nie istnieje, ten wpis nikogo nie autoryzuje.
- Utrzymuj identyfikatory kanałów stabilne. Preferuj identyfikatory numeryczne lub identyfikatory użytkowników zamiast nazw wyświetlanych, gdy kanał obsługuje oba warianty.

## Rozwiązywanie problemów

Jeśli nadawca powinien pasować, ale jest blokowany:

1. Potwierdź, że pole listy dozwolonych zawiera dokładne odwołanie `accessGroup:<name>`.
2. Potwierdź, że `accessGroups.<name>.type` jest poprawne.
3. Potwierdź, że identyfikator nadawcy jest wymieniony pod pasującym kluczem kanału albo pod `"*"`.
4. Potwierdź, że wpis używa zwykłej składni listy dozwolonych tego kanału.
5. W przypadku odbiorców kanału Discord potwierdź, że bot widzi kanał gildii i ma włączone Server Members Intent.

Uruchom `openclaw doctor` po edycji konfiguracji kontroli dostępu. Wykrywa wiele nieprawidłowych kombinacji list dozwolonych i zasad przed wykonaniem.
