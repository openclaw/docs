---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania Zalo Personal lub przepływu wiadomości
summary: Obsługa kont osobistych Zalo przez natywny `zca-js` (logowanie QR), możliwości i konfiguracja
title: Zalo personal
x-i18n:
    generated_at: "2026-04-24T09:01:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (nieoficjalne)

Status: eksperymentalny. Ta integracja automatyzuje **osobiste konto Zalo** przez natywny `zca-js` wewnątrz OpenClaw.

> **Ostrzeżenie:** To nieoficjalna integracja i może skutkować zawieszeniem/zbanowaniem konta. Używasz jej na własne ryzyko.

## Dołączony Plugin

Zalo Personal jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
pakietowe buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego builda albo niestandardowej instalacji bez Zalo Personal,
zainstaluj go ręcznie:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalouser`
- Albo z checkoutu źródłowego: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Pluginy](/pl/tools/plugin)

Nie jest wymagany żaden zewnętrzny binarny CLI `zca`/`openzca`.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo Personal jest dostępny.
   - Bieżące pakietowe wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
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
5. Dostęp do DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa całkowicie w procesie przez `zca-js`.
- Używa natywnych listenerów zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez API JS (tekst/media/link).
- Przeznaczone do przypadków użycia „konta osobistego”, gdy API Zalo Bot nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jednoznacznie wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). `zalo` pozostawiamy zarezerwowane dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Znajdowanie identyfikatorów (katalog)

Użyj CLI katalogu, aby wykrywać peerów/grupy i ich identyfikatory:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limity

- Tekst wychodzący jest dzielony na fragmenty po około 2000 znaków (limity klienta Zalo).
- Streaming jest domyślnie blokowany.

## Kontrola dostępu (DM)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` akceptuje identyfikatory użytkowników lub nazwy. Podczas konfiguracji nazwy są rozwiązywane do identyfikatorów przy użyciu wyszukiwania kontaktów Pluginu działającego w procesie.

Zatwierdzanie przez:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp do grup (opcjonalnie)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- Ograniczenie do listy dozwolonych:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kluczami powinny być stabilne identyfikatory grup; nazwy są rozwiązywane do identyfikatorów podczas startu, gdy to możliwe)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą uruchamiać bota)
- Blokowanie wszystkich grup: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może pytać o listy dozwolonych grup.
- Podczas startu OpenClaw rozwiązuje nazwy grup/użytkowników w listach dozwolonych na identyfikatory i loguje mapowanie.
- Dopasowanie listy dozwolonych grup domyślnie odbywa się wyłącznie po identyfikatorze. Nierozwiązane nazwy są ignorowane przy autoryzacji, chyba że włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza dopasowywanie po zmiennych nazwach grup.
- Jeśli `groupAllowFrom` nie jest ustawione, środowisko wykonawcze używa `allowFrom` jako fallbacku przy sprawdzaniu nadawców grupowych.
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

### Bramkowanie grup przez wzmianki

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi w grupie wymagają wzmianki.
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> domyślnie (`true`).
- Dotyczy to zarówno grup z listy dozwolonych, jak i trybu grup otwartych.
- Cytowanie wiadomości bota liczy się jako niejawna wzmianka do aktywacji grupy.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą omijać bramkowanie przez wzmianki.
- Gdy wiadomość grupowa jest pomijana, bo wymagana jest wzmianka, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza ją do następnej przetwarzanej wiadomości grupowej.
- Domyślny limit historii grupy pochodzi z `messages.groupChat.historyLimit` (fallback `50`). Możesz go nadpisać per konto przez `channels.zalouser.historyLimit`.

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

Konta są mapowane na profile `zalouser` w stanie OpenClaw. Przykład:

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
- Dla wiadomości przychodzących zawierających metadane zdarzenia OpenClaw wysyła potwierdzenia dostarczenia + odczytu (best-effort).

## Rozwiązywanie problemów

**Logowanie nie utrzymuje się:**

- `openclaw channels status --probe`
- Zaloguj się ponownie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nazwa w liście dozwolonych/grupy nie została rozwiązana:**

- Użyj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom`/`groups` albo dokładnych nazw znajomych/grup.

**Aktualizacja ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni wewnątrz OpenClaw, bez zewnętrznych binariów CLI.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie przez wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
