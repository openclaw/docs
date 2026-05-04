---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania w Zalo Personal lub przepływu wiadomości
summary: Obsługa konta osobistego Zalo przez natywne zca-js (logowanie kodem QR), możliwości i konfiguracja
title: Zalo osobisty
x-i18n:
    generated_at: "2026-05-04T18:23:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperymentalne. Ta integracja automatyzuje **osobiste konto Zalo** przez natywne `zca-js` wewnątrz OpenClaw.

<Warning>
To nieoficjalna integracja i może skutkować zawieszeniem lub zbanowaniem konta. Używasz jej na własne ryzyko.
</Warning>

## Dołączony Plugin

Zalo Personal jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
pakietowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza Zalo Personal,
zainstaluj pakiet npm bezpośrednio:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalouser`
- Przypięta wersja: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Albo z checkoutu źródeł: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Plugins](/pl/tools/plugin)

Nie jest wymagany zewnętrzny binarny CLI `zca`/`openzca`.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo Personal jest dostępny.
   - Bieżące pakietowane wydania OpenClaw już go dołączają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie przy użyciu powyższych poleceń.
2. Zaloguj się (QR, na maszynie Gateway):
   - `openclaw channels login --channel zalouser`
   - Zeskanuj kod QR aplikacją mobilną Zalo.
3. Włącz kanał:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Uruchom ponownie Gateway (albo dokończ konfigurację).
5. Dostęp przez DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa w całości w procesie przez `zca-js`.
- Używa natywnych nasłuchiwaczy zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez JS API (tekst/media/link).
- Zaprojektowane dla przypadków użycia „osobistego konta”, gdy Zalo Bot API nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jednoznacznie wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). Zachowujemy `zalo` dla potencjalnej przyszłej oficjalnej integracji z Zalo API.

## Znajdowanie identyfikatorów (katalog)

Użyj katalogowego CLI, aby wykryć osoby/grupy i ich identyfikatory:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Ograniczenia

- Tekst wychodzący jest dzielony na fragmenty po około 2000 znaków (ograniczenia klienta Zalo).
- Strumieniowanie jest domyślnie blokowane.

## Kontrola dostępu (DM)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` powinno używać stabilnych identyfikatorów użytkowników Zalo. Podczas interaktywnej konfiguracji wpisane nazwy można rozwiązać do identyfikatorów przy użyciu wyszukiwania kontaktów w procesie Plugin.

Jeśli surowa nazwa pozostaje w konfiguracji, przy uruchamianiu jest rozwiązywana tylko wtedy, gdy włączono `channels.zalouser.dangerouslyAllowNameMatching: true`. Bez tej zgody sprawdzanie nadawcy w czasie działania używa wyłącznie identyfikatorów, a surowe nazwy są ignorowane przy autoryzacji.

Zatwierdź przez:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp grupowy (opcjonalny)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby zastąpić wartość domyślną, gdy nie jest ustawiona.
- Ogranicz do listy dozwolonych za pomocą:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (klucze powinny być stabilnymi identyfikatorami grup; nazwy są rozwiązywane do identyfikatorów przy uruchamianiu tylko wtedy, gdy włączono `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą uruchamiać bota)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może poprosić o listy dozwolonych grup.
- Przy uruchamianiu OpenClaw rozwiązuje nazwy grup/użytkowników na listach dozwolonych do identyfikatorów i loguje mapowanie tylko wtedy, gdy włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- Dopasowywanie listy dozwolonych grup domyślnie odbywa się wyłącznie po identyfikatorze. Nierozwiązane nazwy są ignorowane przy autoryzacji, chyba że włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza zmienne rozwiązywanie nazw przy uruchamianiu oraz dopasowywanie nazw grup w czasie działania.
- Jeśli `groupAllowFrom` nie jest ustawione, środowisko uruchomieniowe używa zastępczo `allowFrom` do sprawdzania nadawców grupowych.
- Sprawdzanie nadawców dotyczy zarówno zwykłych wiadomości grupowych, jak i poleceń sterujących (na przykład `/new`, `/reset`).

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Bramka wzmianek w grupie

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi grupowe wymagają wzmianki.
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> domyślnie (`true`).
- Dotyczy to zarówno grup z listy dozwolonych, jak i trybu otwartych grup.
- Cytowanie wiadomości bota liczy się jako niejawna wzmianka aktywująca grupę.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą omijać bramkę wzmianek.
- Gdy wiadomość grupowa zostanie pominięta, ponieważ wymagana jest wzmianka, OpenClaw przechowuje ją jako oczekującą historię grupy i dołącza ją do następnej przetwarzanej wiadomości grupowej.
- Limit historii grupy domyślnie wynosi `messages.groupChat.historyLimit` (wartość zastępcza `50`). Możesz go nadpisać dla konta za pomocą `channels.zalouser.historyLimit`.

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Wiele kont

Konta mapują się na profile `zalouser` w stanie OpenClaw. Przykład:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Pisanie, reakcje i potwierdzenia dostarczenia

- OpenClaw wysyła zdarzenie pisania przed wysłaniem odpowiedzi (best-effort).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć konkretną reakcję emoji z wiadomości.
  - Semantyka reakcji: [Reakcje](/pl/tools/reactions)
- Dla wiadomości przychodzących, które zawierają metadane zdarzenia, OpenClaw wysyła potwierdzenia dostarczenia i wyświetlenia (best-effort).

## Rozwiązywanie problemów

**Logowanie nie zostaje zapamiętane:**

- `openclaw channels status --probe`
- Ponowne logowanie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Lista dozwolonych/nazwa grupy nie została rozwiązana:**

- Użyj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom` i stabilnych identyfikatorów grup w `groups`. Jeśli celowo potrzebujesz dokładnych nazw znajomych/grup, włącz `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Uaktualniono ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni w OpenClaw bez zewnętrznych binariów CLI.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramka wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
