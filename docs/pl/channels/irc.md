---
read_when:
    - Chcesz połączyć OpenClaw z kanałami IRC lub wiadomościami prywatnymi
    - Konfigurujesz listy dozwolonych IRC, politykę grupową lub bramkowanie wzmianek
summary: Konfiguracja Plugin IRC, kontrola dostępu i rozwiązywanie problemów
title: IRC
x-i18n:
    generated_at: "2026-04-24T08:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

Użyj IRC, gdy chcesz korzystać z OpenClaw w klasycznych kanałach (`#room`) i wiadomościach prywatnych.
IRC jest dostarczany jako dołączony Plugin, ale konfiguruje się go w głównej konfiguracji pod `channels.irc`.

## Szybki start

1. Włącz konfigurację IRC w `~/.openclaw/openclaw.json`.
2. Ustaw co najmniej:

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

Do koordynacji botów preferuj prywatny serwer IRC. Jeśli świadomie używasz publicznej sieci IRC, typowe wybory to Libera.Chat, OFTC i Snoonet. Unikaj przewidywalnych publicznych kanałów dla ruchu zaplecza botów lub swarm.

3. Uruchom/uruchom ponownie Gateway:

```bash
openclaw gateway run
```

## Domyślne ustawienia bezpieczeństwa

- `channels.irc.dmPolicy` domyślnie ma wartość `"pairing"`.
- `channels.irc.groupPolicy` domyślnie ma wartość `"allowlist"`.
- Przy `groupPolicy="allowlist"` ustaw `channels.irc.groups`, aby zdefiniować dozwolone kanały.
- Używaj TLS (`channels.irc.tls=true`), chyba że świadomie akceptujesz transport jawnym tekstem.

## Kontrola dostępu

Dla kanałów IRC istnieją dwie oddzielne „bramki”:

1. **Dostęp do kanału** (`groupPolicy` + `groups`): czy bot w ogóle akceptuje wiadomości z danego kanału.
2. **Dostęp nadawcy** (`groupAllowFrom` / per-channel `groups["#channel"].allowFrom`): kto może wywoływać bota w tym kanale.

Klucze konfiguracji:

- allowlista DM (dostęp nadawcy DM): `channels.irc.allowFrom`
- allowlista nadawców grupowych (dostęp nadawcy kanału): `channels.irc.groupAllowFrom`
- Kontrola per channel (kanał + nadawca + reguły wzmianek): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` pozwala na nieskonfigurowane kanały (**domyślnie nadal wymagane są wzmianki**)

Wpisy allowlisty powinny używać stabilnych tożsamości nadawców (`nick!user@host`).
Dopasowanie po samym nicku jest zmienne i jest włączane tylko wtedy, gdy `channels.irc.dangerouslyAllowNameMatching: true`.

### Częsty problem: `allowFrom` jest dla DM, a nie kanałów

Jeśli widzisz logi takie jak:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…oznacza to, że nadawca nie był dozwolony dla wiadomości **grupowych/kanałowych**. Napraw to, wykonując jedną z poniższych czynności:

- ustaw `channels.irc.groupAllowFrom` (globalnie dla wszystkich kanałów), lub
- ustaw allowlisty nadawców per channel: `channels.irc.groups["#channel"].allowFrom`

Przykład (pozwól każdemu w `#tuirc-dev` rozmawiać z botem):

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

Nawet jeśli kanał jest dozwolony (przez `groupPolicy` + `groups`) i nadawca jest dozwolony, OpenClaw domyślnie stosuje **wymaganie wzmianki** w kontekstach grupowych.

Oznacza to, że możesz zobaczyć logi takie jak `drop channel … (missing-mention)`, chyba że wiadomość zawiera wzorzec wzmianki pasujący do bota.

Aby bot odpowiadał w kanale IRC **bez potrzeby wzmianki**, wyłącz wymaganie wzmianki dla tego kanału:

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

Lub aby zezwolić na **wszystkie** kanały IRC (bez allowlisty per channel) i nadal odpowiadać bez wzmianek:

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

## Uwaga dotycząca bezpieczeństwa (zalecane dla kanałów publicznych)

Jeśli ustawisz `allowFrom: ["*"]` w publicznym kanale, każdy może wysyłać prompty do bota.
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

### Różne narzędzia dla różnych nadawców (właściciel ma większe uprawnienia)

Użyj `toolsBySender`, aby zastosować bardziej rygorystyczną politykę do `"*"` i mniej rygorystyczną do swojego nicka:

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

- Klucze `toolsBySender` powinny używać `id:` dla wartości tożsamości nadawców IRC:
  `id:eigen` lub `id:eigen!~eigen@174.127.248.171` dla silniejszego dopasowania.
- Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.
- Pierwsza pasująca polityka nadawcy wygrywa; `"*"` jest awaryjnym dopasowaniem wieloznacznym.

Więcej informacji o dostępie grupowym a wymaganiu wzmianki (i o tym, jak ze sobą współdziałają) znajdziesz tutaj: [/channels/groups](/pl/channels/groups).

## NickServ

Aby uwierzytelniać się w NickServ po połączeniu:

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

Wyłącz `register` po zarejestrowaniu nicka, aby uniknąć ponawianych prób REGISTER.

## Zmienne środowiskowe

Domyślne konto obsługuje:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (rozdzielane przecinkami)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` nie może być ustawiane z obszaru roboczego `.env`; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

## Rozwiązywanie problemów

- Jeśli bot się łączy, ale nigdy nie odpowiada na kanałach, sprawdź `channels.irc.groups` **oraz** to, czy wymaganie wzmianki nie odrzuca wiadomości (`missing-mention`). Jeśli chcesz, aby odpowiadał bez pingów, ustaw `requireMention:false` dla kanału.
- Jeśli logowanie się nie powiedzie, sprawdź dostępność nicka i hasło serwera.
- Jeśli TLS nie działa w niestandardowej sieci, sprawdź konfigurację hosta/portu i certyfikatów.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i wymaganie wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
