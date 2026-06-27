---
read_when:
    - Chcesz połączyć OpenClaw z kanałami IRC lub wiadomościami prywatnymi
    - Konfigurujesz listy dozwolonych IRC, zasady grup lub bramkowanie wzmianek
summary: Konfiguracja Plugin IRC, kontrola dostępu i rozwiązywanie problemów
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:11:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

Używaj IRC, gdy chcesz korzystać z OpenClaw w klasycznych kanałach (`#room`) i wiadomościach bezpośrednich.
Zainstaluj oficjalny Plugin IRC, a następnie skonfiguruj go w `channels.irc`.

## Szybki start

1. Zainstaluj Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Włącz konfigurację IRC w `~/.openclaw/openclaw.json`.
3. Ustaw co najmniej:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Do koordynacji botów preferuj prywatny serwer IRC. Jeśli celowo używasz publicznej sieci IRC, częste wybory to Libera.Chat, OFTC i Snoonet. Unikaj przewidywalnych publicznych kanałów dla ruchu zaplecza botów lub rojów.

4. Uruchom/uruchom ponownie Gateway:

```bash
openclaw gateway run
```

## Domyślne ustawienia bezpieczeństwa

- IRC używa surowych gniazd TCP/TLS poza routingiem przez przekazujący serwer proxy zarządzany przez operatora OpenClaw. We wdrożeniach, które wymagają całego ruchu wychodzącego przez ten przekazujący serwer proxy, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC jest wyraźnie zatwierdzony.
- `channels.irc.dmPolicy` domyślnie ma wartość `"pairing"`.
- `channels.irc.groupPolicy` domyślnie ma wartość `"allowlist"`.
- Przy `groupPolicy="allowlist"` ustaw `channels.irc.groups`, aby zdefiniować dozwolone kanały.
- Używaj TLS (`channels.irc.tls=true`), chyba że celowo akceptujesz transport tekstem jawnym.

## Kontrola dostępu

Dla kanałów IRC istnieją dwie osobne „bramki”:

1. **Dostęp do kanału** (`groupPolicy` + `groups`): czy bot w ogóle przyjmuje wiadomości z kanału.
2. **Dostęp nadawcy** (`groupAllowFrom` / `groups["#channel"].allowFrom` dla kanału): kto może wyzwalać bota w tym kanale.

Klucze konfiguracji:

- Lista dozwolonych DM (dostęp nadawcy DM): `channels.irc.allowFrom`
- Lista dozwolonych nadawców grupy (dostęp nadawcy w kanale): `channels.irc.groupAllowFrom`
- Kontrole dla kanału (reguły kanału, nadawcy i wzmianek): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` zezwala na nieskonfigurowane kanały (**nadal domyślnie wymagają wzmianki**)

Wpisy listy dozwolonych powinny używać stabilnych tożsamości nadawców (`nick!user@host`).
Dopasowywanie samego nicka jest zmienne i włączone tylko wtedy, gdy `channels.irc.dangerouslyAllowNameMatching: true`.

### Częsta pułapka: `allowFrom` jest dla DM, nie dla kanałów

Jeśli widzisz logi takie jak:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...oznacza to, że nadawca nie był dozwolony dla wiadomości **grupowych/kanałowych**. Napraw to przez:

- ustawienie `channels.irc.groupAllowFrom` (globalnie dla wszystkich kanałów) albo
- ustawienie list dozwolonych nadawców dla kanału: `channels.irc.groups["#channel"].allowFrom`

Przykład (zezwól każdemu w `#tuirc-dev` na rozmowę z botem):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Wyzwalanie odpowiedzi (wzmianki)

Nawet jeśli kanał jest dozwolony (przez `groupPolicy` + `groups`) i nadawca jest dozwolony, OpenClaw domyślnie wymaga **bramkowania wzmiankami** w kontekstach grupowych.

Oznacza to, że możesz zobaczyć logi takie jak `drop channel … (missing-mention)`, chyba że wiadomość zawiera wzorzec wzmianki pasujący do bota.

Aby bot odpowiadał w kanale IRC **bez potrzeby wzmianki**, wyłącz bramkowanie wzmiankami dla tego kanału:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Albo aby zezwolić na **wszystkie** kanały IRC (bez listy dozwolonych dla poszczególnych kanałów) i nadal odpowiadać bez wzmianek:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Uwaga bezpieczeństwa (zalecane dla kanałów publicznych)

Jeśli zezwolisz na `allowFrom: ["*"]` w kanale publicznym, każdy może wysłać prompt do bota.
Aby zmniejszyć ryzyko, ogranicz narzędzia dla tego kanału.

### Te same narzędzia dla wszystkich w kanale

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Różne narzędzia dla poszczególnych nadawców (właściciel ma większe uprawnienia)

Użyj `toolsBySender`, aby zastosować surowszą politykę do `"*"` i luźniejszą do swojego nicka:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Uwagi:

- Klucze `toolsBySender` powinny używać `id:` dla wartości tożsamości nadawcy IRC:
  `id:eigen` albo `id:eigen!~eigen@174.127.248.171` dla silniejszego dopasowania.
- Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane wyłącznie jako `id:`.
- Wygrywa pierwsza pasująca polityka nadawcy; `"*"` jest awaryjnym symbolem wieloznacznym.

Więcej informacji o dostępie grupowym i bramkowaniu wzmiankami (oraz o ich współdziałaniu) znajdziesz tutaj: [/channels/groups](/pl/channels/groups).

## NickServ

Aby zidentyfikować się w NickServ po połączeniu:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Opcjonalna jednorazowa rejestracja przy połączeniu:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Wyłącz `register` po zarejestrowaniu nicka, aby uniknąć powtarzanych prób REGISTER.

## Zmienne środowiskowe

Konto domyślne obsługuje:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (oddzielone przecinkami)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` nie może być ustawione z pliku `.env` w workspace; zobacz [pliki `.env` workspace](/pl/gateway/security).

## Rozwiązywanie problemów

- Jeśli bot łączy się, ale nigdy nie odpowiada w kanałach, sprawdź `channels.irc.groups` **oraz** czy bramkowanie wzmiankami odrzuca wiadomości (`missing-mention`). Jeśli chcesz, aby odpowiadał bez pingów, ustaw `requireMention:false` dla kanału.
- Jeśli logowanie się nie powiedzie, sprawdź dostępność nicka i hasło serwera.
- Jeśli TLS nie działa w niestandardowej sieci, sprawdź host/port i konfigurację certyfikatu.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
