---
read_when:
    - Chcesz połączyć OpenClaw z kanałami IRC lub wiadomościami DM
    - Konfigurujesz allowlisty IRC, politykę grup lub bramkowanie wzmianek
summary: Konfiguracja wtyczki IRC, kontrola dostępu i rozwiązywanie problemów
title: IRC
x-i18n:
    generated_at: "2026-04-05T13:43:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: fceab2979db72116689c6c774d6736a8a2eee3559e3f3cf8969e673d317edd94
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Używaj IRC, gdy chcesz mieć OpenClaw na klasycznych kanałach (`#room`) i w wiadomościach bezpośrednich.
IRC jest dostarczane jako wtyczka rozszerzenia, ale konfiguruje się je w głównej konfiguracji pod `channels.irc`.

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

Preferuj prywatny serwer IRC do koordynacji bota. Jeśli celowo używasz publicznej sieci IRC, często wybierane opcje to Libera.Chat, OFTC i Snoonet. Unikaj przewidywalnych publicznych kanałów dla ruchu zaplecza botów lub swarmów.

3. Uruchom/uruchom ponownie gateway:

```bash
openclaw gateway run
```

## Domyślne ustawienia bezpieczeństwa

- `channels.irc.dmPolicy` domyślnie ma wartość `"pairing"`.
- `channels.irc.groupPolicy` domyślnie ma wartość `"allowlist"`.
- Przy `groupPolicy="allowlist"` ustaw `channels.irc.groups`, aby określić dozwolone kanały.
- Używaj TLS (`channels.irc.tls=true`), chyba że celowo akceptujesz transport jawnym tekstem.

## Kontrola dostępu

Dla kanałów IRC istnieją dwie oddzielne „bramki”:

1. **Dostęp do kanału** (`groupPolicy` + `groups`): czy bot w ogóle akceptuje wiadomości z danego kanału.
2. **Dostęp nadawcy** (`groupAllowFrom` / per-channel `groups["#channel"].allowFrom`): kto może wywołać bota w tym kanale.

Klucze konfiguracji:

- Allowlista DM (dostęp nadawcy DM): `channels.irc.allowFrom`
- Allowlista nadawców grupowych (dostęp nadawcy kanału): `channels.irc.groupAllowFrom`
- Kontrole per kanał (kanał + nadawca + reguły wzmianek): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` zezwala na nieskonfigurowane kanały (**domyślnie nadal objęte bramkowaniem wzmianek**)

Wpisy allowlisty powinny używać stabilnych tożsamości nadawcy (`nick!user@host`).
Dopasowanie tylko po nicku jest zmienne i jest włączone tylko wtedy, gdy `channels.irc.dangerouslyAllowNameMatching: true`.

### Częsty problem: `allowFrom` dotyczy DM, nie kanałów

Jeśli widzisz logi takie jak:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…oznacza to, że nadawca nie był dozwolony dla wiadomości **grupowych/kanałowych**. Naprawisz to, wykonując jedną z poniższych czynności:

- ustawiając `channels.irc.groupAllowFrom` (globalnie dla wszystkich kanałów), albo
- ustawiając allowlisty nadawców per kanał: `channels.irc.groups["#channel"].allowFrom`

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

Nawet jeśli kanał jest dozwolony (przez `groupPolicy` + `groups`) i nadawca jest dozwolony, OpenClaw domyślnie stosuje **bramkowanie wzmianek** w kontekstach grupowych.

Oznacza to, że możesz zobaczyć logi takie jak `drop channel … (missing-mention)`, chyba że wiadomość zawiera wzorzec wzmianki pasujący do bota.

Aby bot odpowiadał w kanale IRC **bez potrzeby wzmianki**, wyłącz bramkowanie wzmianek dla tego kanału:

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

Lub aby zezwolić na **wszystkie** kanały IRC (bez allowlisty per kanał) i nadal odpowiadać bez wzmianek:

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

## Uwaga dotycząca bezpieczeństwa (zalecane dla publicznych kanałów)

Jeśli zezwolisz na `allowFrom: ["*"]` w publicznym kanale, każdy może promptować bota.
Aby zmniejszyć ryzyko, ogranicz narzędzia dla tego kanału.

### Te same narzędzia dla wszystkich na kanale

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

Użyj `toolsBySender`, aby zastosować bardziej restrykcyjną politykę do `"*"` i mniej restrykcyjną do swojego nicka:

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
  `id:eigen` lub `id:eigen!~eigen@174.127.248.171` dla silniejszego dopasowania.
- Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.
- Pierwsza pasująca polityka nadawcy wygrywa; `"*"` jest zapasowym wildcardem.

Więcej informacji o dostępie grupowym vs. bramkowaniu wzmianek (i o tym, jak współdziałają) znajdziesz tutaj: [/channels/groups](/channels/groups).

## NickServ

Aby uwierzytelnić się w NickServ po połączeniu:

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

Domyślne konto obsługuje:

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

## Rozwiązywanie problemów

- Jeśli bot się łączy, ale nigdy nie odpowiada na kanałach, sprawdź `channels.irc.groups` **oraz** czy bramkowanie wzmianek odrzuca wiadomości (`missing-mention`). Jeśli chcesz, aby odpowiadał bez pingnięć, ustaw `requireMention:false` dla kanału.
- Jeśli logowanie się nie powiedzie, sprawdź dostępność nicka i hasło serwera.
- Jeśli TLS nie działa w niestandardowej sieci, sprawdź konfigurację hosta/portu i certyfikatów.

## Powiązane

- [Channels Overview](/channels) — wszystkie obsługiwane kanały
- [Pairing](/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Channel Routing](/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/gateway/security) — model dostępu i utwardzanie
