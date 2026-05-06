---
read_when:
    - Chcesz połączyć OpenClaw z kanałami IRC lub wiadomościami prywatnymi
    - Konfigurujesz listy dozwolonych dla IRC, zasady grup albo ograniczanie wzmianek
summary: Konfiguracja Plugin IRC, kontrola dostępu i rozwiązywanie problemów
title: IRC
x-i18n:
    generated_at: "2026-05-06T09:03:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7de49784dec1b6a21a5a65b298552c66ce82543e3f0a7075abedb442b4ebff7e
    source_path: channels/irc.md
    workflow: 16
---

Użyj IRC, gdy chcesz mieć OpenClaw w klasycznych kanałach (`#room`) i wiadomościach bezpośrednich.
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

Preferuj prywatny serwer IRC do koordynacji botów. Jeśli celowo używasz publicznej sieci IRC, popularne opcje to Libera.Chat, OFTC i Snoonet. Unikaj przewidywalnych kanałów publicznych dla ruchu zaplecza bota lub roju.

3. Uruchom/uruchom ponownie bramę:

```bash
openclaw gateway run
```

## Domyślne ustawienia bezpieczeństwa

- IRC używa surowych gniazd TCP/TLS poza trasowaniem przez zarządzany przez operatora OpenClaw forward proxy. W wdrożeniach, które wymagają, aby cały ruch wychodzący przechodził przez ten forward proxy, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC został jawnie zatwierdzony.
- `channels.irc.dmPolicy` domyślnie ma wartość `"pairing"`.
- `channels.irc.groupPolicy` domyślnie ma wartość `"allowlist"`.
- Przy `groupPolicy="allowlist"` ustaw `channels.irc.groups`, aby zdefiniować dozwolone kanały.
- Używaj TLS (`channels.irc.tls=true`), chyba że celowo akceptujesz transport tekstem jawnym.

## Kontrola dostępu

Istnieją dwie oddzielne „bramki” dla kanałów IRC:

1. **Dostęp do kanału** (`groupPolicy` + `groups`): czy bot w ogóle akceptuje wiadomości z kanału.
2. **Dostęp nadawcy** (`groupAllowFrom` / `groups["#channel"].allowFrom` dla kanału): kto może uruchamiać bota w tym kanale.

Klucze konfiguracji:

- Lista dozwolonych DM (dostęp nadawcy DM): `channels.irc.allowFrom`
- Lista dozwolonych nadawców grupowych (dostęp nadawcy w kanale): `channels.irc.groupAllowFrom`
- Kontrole dla kanału (kanał + nadawca + reguły wzmianek): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` zezwala na nieskonfigurowane kanały (**nadal domyślnie wymagające wzmianki**)

Wpisy listy dozwolonych powinny używać stabilnych tożsamości nadawców (`nick!user@host`).
Dopasowanie samego nicka jest zmienne i włączone tylko wtedy, gdy `channels.irc.dangerouslyAllowNameMatching: true`.

### Częsta pułapka: `allowFrom` dotyczy DM, a nie kanałów

Jeśli widzisz logi takie jak:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...oznacza to, że nadawca nie był dozwolony dla wiadomości **grupowych/kanałowych**. Napraw to przez:

- ustawienie `channels.irc.groupAllowFrom` (globalnie dla wszystkich kanałów), albo
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

Nawet jeśli kanał jest dozwolony (przez `groupPolicy` + `groups`) i nadawca jest dozwolony, OpenClaw domyślnie stosuje **bramkowanie wzmiankami** w kontekstach grupowych.

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

Albo aby zezwolić na **wszystkie** kanały IRC (bez listy dozwolonych dla kanału) i nadal odpowiadać bez wzmianek:

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

Jeśli zezwolisz na `allowFrom: ["*"]` w kanale publicznym, każdy może wysłać prompt do bota.
Aby ograniczyć ryzyko, ogranicz narzędzia dla tego kanału.

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
- Wygrywa pierwsza pasująca polityka nadawcy; `"*"` jest rezerwowym symbolem wieloznacznym.

Więcej informacji o dostępie grupowym i bramkowaniu wzmiankami (oraz o tym, jak współdziałają) znajdziesz tutaj: [/channels/groups](/pl/channels/groups).

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

Wyłącz `register` po zarejestrowaniu nicka, aby uniknąć powtarzających się prób REGISTER.

## Zmienne środowiskowe

Konto domyślne obsługuje:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (rozdzielone przecinkami)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` nie może być ustawione z pliku `.env` obszaru roboczego; zobacz [pliki `.env` obszaru roboczego](/pl/gateway/security).

## Rozwiązywanie problemów

- Jeśli bot łączy się, ale nigdy nie odpowiada w kanałach, sprawdź `channels.irc.groups` **oraz** czy bramkowanie wzmiankami odrzuca wiadomości (`missing-mention`). Jeśli chcesz, aby odpowiadał bez pingów, ustaw `requireMention:false` dla kanału.
- Jeśli logowanie się nie powiedzie, sprawdź dostępność nicka i hasło serwera.
- Jeśli TLS nie działa w niestandardowej sieci, sprawdź host/port i konfigurację certyfikatu.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
