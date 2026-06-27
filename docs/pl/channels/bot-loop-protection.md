---
read_when:
    - Konfigurowanie wiadomości kanału tworzonych przez bota
    - Dostrajanie ochrony przed pętlami bot-bot
sidebarTitle: Bot loop protection
summary: Domyślna ochrona przed pętlami między botami i nadpisania kanałów
title: Ochrona przed pętlą botów
x-i18n:
    generated_at: "2026-06-27T17:09:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Ochrona przed pętlą botów

OpenClaw może przyjmować wiadomości napisane przez inne boty w kanałach obsługujących `allowBots`.
Gdy ta ścieżka jest włączona, ochrona przed pętlą par zapobiega nieskończonemu
odpowiadaniu sobie nawzajem przez dwie tożsamości botów.

Zabezpieczenie jest egzekwowane przez główny mechanizm uruchamiania odpowiedzi przychodzących. Każdy obsługiwany kanał
mapuje własne zdarzenie przychodzące na ogólne fakty: konto lub zakres, identyfikator rozmowy,
identyfikator bota nadawcy i identyfikator bota odbiorcy. Następnie rdzeń śledzi parę uczestników w obu
kierunkach, stosuje budżet w oknie kroczącym i wycisza parę podczas
okresu schłodzenia po przekroczeniu budżetu.

## Domyślne ustawienia

Ochrona przed pętlą par jest aktywna, gdy kanał pozwala wiadomościom utworzonym przez boty trafiać do
dyspozycji. Wbudowane wartości domyślne to:

- `maxEventsPerWindow: 20` - para botów może wymienić 20 zdarzeń w oknie
- `windowSeconds: 60` - długość okna kroczącego
- `cooldownSeconds: 60` - czas wyciszenia po przekroczeniu budżetu przez parę

Zabezpieczenie nie wpływa na zwykłe wiadomości napisane przez ludzi, wdrożenia z jednym botem,
filtrowanie wiadomości własnych ani jednorazowe odpowiedzi botów, które mieszczą się w budżecie.

## Konfigurowanie współdzielonych ustawień domyślnych

Ustaw `channels.defaults.botLoopProtection` raz, aby nadać każdemu obsługiwanemu kanałowi
taką samą podstawę. Nadpisania kanałów i kont nadal mogą dostrajać poszczególne
powierzchnie.

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

Ustaw `enabled: false` tylko wtedy, gdy polityka kanału celowo zezwala na
rozmowy między botami bez automatycznego wyciszania.

## Nadpisywanie dla kanału lub konta

Obsługiwane kanały nakładają własną konfigurację na współdzielone ustawienie domyślne. Priorytet jest następujący:

- `channels.<channel>.<room-or-space>.botLoopProtection`, gdy kanał obsługuje nadpisania dla poszczególnych rozmów
- `channels.<channel>.accounts.<account>.botLoopProtection`, gdy kanał obsługuje konta
- `channels.<channel>.botLoopProtection`, gdy kanał obsługuje ustawienia domyślne najwyższego poziomu
- `channels.defaults.botLoopProtection`
- wbudowane ustawienia domyślne

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
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
  },
}
```

## Obsługa kanałów

- Discord: natywne fakty `author.bot`, kluczowane według konta Discord, kanału i pary botów.
- Slack: natywne fakty `bot_id` dla zaakceptowanych wiadomości utworzonych przez boty, kluczowane według konta Slack, kanału i pary botów.
- Matrix: skonfigurowane konta botów Matrix, kluczowane według konta Matrix, pokoju i skonfigurowanej pary botów.
- Google Chat: natywne fakty `sender.type=BOT` dla zaakceptowanych wiadomości utworzonych przez boty, kluczowane według konta, przestrzeni i pary botów.

Kanały, które nie ujawniają wiarygodnej tożsamości bota przychodzącego, nadal używają swoich
normalnych filtrów wiadomości własnych i polityki dostępu. Nie powinny włączać tego
zabezpieczenia, dopóki nie będą mogły zidentyfikować obu uczestników pary botów.

Szczegóły implementacji pluginu znajdziesz w [środowisku uruchomieniowym SDK](/pl/plugins/sdk-runtime#reusable-runtime-utilities).
