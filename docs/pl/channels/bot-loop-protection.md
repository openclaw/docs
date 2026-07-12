---
read_when:
    - Konfigurowanie wiadomości na kanałach tworzonych przez boty
    - Dostrajanie ochrony przed pętlami między botami
sidebarTitle: Bot loop protection
summary: Domyślne ustawienia ochrony przed pętlami między botami i nadpisania dla kanałów
title: Ochrona przed zapętleniem botów
x-i18n:
    generated_at: "2026-07-12T14:47:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw może przyjmować wiadomości napisane przez inne boty w kanałach obsługujących `allowBots`. Gdy ta ścieżka jest włączona, ochrona przed pętlą między parami zapobiega bezterminowemu odpowiadaniu sobie przez dwie tożsamości botów.

Mechanizm ochronny jest egzekwowany przez główny moduł obsługi odpowiedzi przychodzących. Każdy obsługiwany kanał przekształca zdarzenie przychodzące w ogólne dane: konto lub zakres, identyfikator konwersacji, identyfikator bota nadawcy i identyfikator bota odbiorcy. Rdzeń śledzi parę uczestników w obu kierunkach (A do B i B do A są traktowane jako ta sama para), stosuje limit w przesuwanym oknie i blokuje parę na czas karencji po przekroczeniu limitu.

## Wartości domyślne

Ochrona przed pętlą między parami jest aktywna zawsze, gdy kanał dopuszcza wiadomości utworzone przez boty do przekazania dalej. Wbudowane wartości domyślne:

| Klucz                | Wartość domyślna | Znaczenie                                                    |
| -------------------- | ----------------- | ------------------------------------------------------------ |
| `enabled`            | `true`            | Ochrona aktywna dla kanałów, które ją obsługują.              |
| `maxEventsPerWindow` | `20`              | Liczba zdarzeń, które para botów może wymienić w danym oknie. |
| `windowSeconds`      | `60`              | Długość przesuwanego okna.                                   |
| `cooldownSeconds`    | `60`              | Czas blokady po przekroczeniu limitu przez parę.              |

Mechanizm ochronny nie wpływa na wiadomości napisane przez ludzi, wdrożenia z jednym botem, filtrowanie własnych wiadomości ani odpowiedzi botów mieszczące się w limicie.

## Konfigurowanie wspólnych wartości domyślnych

Ustaw `channels.defaults.botLoopProtection` jednokrotnie, aby zapewnić wszystkim obsługiwanym kanałom tę samą konfigurację bazową. Nadpisania na poziomie kanału, konta i pokoju nadal mogą dostosowywać poszczególne obszary.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Ustaw `enabled: false` tylko wtedy, gdy zasady kanału celowo zezwalają na konwersacje między botami bez automatycznej blokady.

## Nadpisywanie dla kanału, konta lub pokoju

Obsługiwane kanały nakładają własną konfigurację na wspólne wartości domyślne, klucz po kluczu. Kolejność pierwszeństwa, od najbardziej szczegółowej:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, gdy kanał obsługuje nadpisania dla poszczególnych konwersacji
2. `channels.<channel>.accounts.<account>.botLoopProtection`, gdy kanał obsługuje konta
3. `channels.<channel>.botLoopProtection`, gdy kanał obsługuje wartości domyślne najwyższego poziomu
4. `channels.defaults.botLoopProtection`
5. wbudowane wartości domyślne

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Obsługa kanałów

- Discord: natywne dane `author.bot`, indeksowane według konta Discord, kanału i pary botów.
- Google Chat: natywne dane `sender.type=BOT` dla zaakceptowanych wiadomości napisanych przez boty, indeksowane według konta, przestrzeni i pary botów.
- Matrix: skonfigurowane konta botów Matrix, indeksowane według konta Matrix, pokoju i skonfigurowanej pary botów.
- Slack: natywne dane `bot_id` dla zaakceptowanych wiadomości napisanych przez boty, indeksowane według konta Slack, kanału i pary botów.

Kanały, które nie udostępniają wiarygodnej tożsamości przychodzącego bota, nadal korzystają ze standardowych filtrów własnych wiadomości i zasad dostępu. Nie powinny korzystać z tego mechanizmu ochronnego, dopóki nie będą w stanie zidentyfikować obu uczestników pary botów.

Szczegóły implementacji Pluginów zawiera sekcja [środowisko wykonawcze SDK](/pl/plugins/sdk-runtime#reusable-runtime-utilities).
