---
read_when:
    - Udostępnianie Gateway przez LAN, tailnet, Tailscale Serve, Funnel lub reverse proxy
    - Przegląd wdrożenia przed dopuszczeniem prawdziwych użytkowników wiadomości
    - Cofanie ryzykownej konfiguracji zdalnego dostępu lub wiadomości bezpośrednich
sidebarTitle: Exposure runbook
summary: Lista kontrolna pre-flight i wycofania zmian przed udostępnieniem OpenClaw Gateway poza loopback
title: Runbook ekspozycji Gateway
x-i18n:
    generated_at: "2026-06-27T17:37:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Udostępnij Gateway dopiero wtedy, gdy potrafisz wyjaśnić, kto może się z nim połączyć, jak jest
uwierzytelniany, których agentów może uruchamiać i których narzędzi ci agenci mogą
używać. W razie wątpliwości wróć do dostępu wyłącznie przez pętlę zwrotną i ponownie uruchom audyt.
</Warning>

Ten runbook przekształca szersze wytyczne z sekcji [Bezpieczeństwo](/pl/gateway/security) w
listę kontrolną operatora dotyczącą dostępu zdalnego i ekspozycji komunikatorów.

## Wybierz wzorzec ekspozycji

Preferuj najwęższy wzorzec, który spełnia wymagania przepływu pracy.

| Wzorzec                    | Zalecany, gdy                                    | Wymagane zabezpieczenia                                                                              |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Pętla zwrotna + tunel SSH  | Użytek osobisty, dostęp administratora, debugowanie | Zachowaj `gateway.bind: "loopback"` i tunel `127.0.0.1:18789`                                      |
| Pętla zwrotna + Tailscale Serve | Osobisty dostęp przez tailnet do Control UI/WebSocket | Zachowaj Gateway wyłącznie na pętli zwrotnej; polegaj na nagłówkach tożsamości Tailscale tylko dla obsługiwanych powierzchni |
| Powiązanie z tailnet/LAN   | Dedykowana sieć prywatna ze znanymi urządzeniami | Uwierzytelnianie Gateway, lista dozwolonych w zaporze, brak publicznego przekierowania portów       |
| Zaufany reverse proxy      | SSO/OIDC organizacji przed Gateway              | Uwierzytelnianie `trusted-proxy`, ścisłe `trustedProxies`, reguły nadpisywania/usuwania nagłówków, jawnie dozwoleni użytkownicy |
| Publiczny internet         | Rzadkie wdrożenia wysokiego ryzyka              | Proxy świadome tożsamości, TLS, limity szybkości, ścisłe listy dozwolonych, odizolowane sesje inne niż główne |

Unikaj bezpośredniego publicznego przekierowania portów do Gateway. Jeśli potrzebujesz dostępu publicznego,
umieść przed nim proxy świadome tożsamości i spraw, aby proxy było jedyną ścieżką sieciową
do Gateway.

## Inwentaryzacja wstępna

Zapisz te informacje przed zmianą zasad powiązania, proxy, Tailscale lub kanałów:

- Host Gateway, użytkownik systemu operacyjnego i katalog stanu.
- URL Gateway i tryb powiązania.
- Tryb uwierzytelniania, źródło tokenu/hasła lub źródło tożsamości zaufanego proxy.
- Wszystkie włączone kanały oraz to, czy akceptują wiadomości prywatne, grupy czy Webhooki.
- Agenci osiągalni dla nadawców spoza hosta lokalnego.
- Profil narzędzi, tryb piaskownicy i zasady narzędzi z podwyższonymi uprawnieniami dla każdego osiągalnego agenta.
- Zewnętrzne poświadczenia dostępne dla tych agentów.
- Lokalizacja kopii zapasowej `~/.openclaw/openclaw.json` i poświadczeń.

Jeśli więcej niż jedna osoba może wysyłać wiadomości do bota, traktuj to jako współdzielone delegowane
uprawnienie do narzędzi, a nie jako izolację hosta per użytkownik.

## Kontrole bazowe

Uruchom te polecenia przed otwarciem dostępu:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Najpierw rozwiąż krytyczne ustalenia. Ostrzeżenia mogą być akceptowalne tylko wtedy, gdy są
zamierzone i udokumentowane dla danego wdrożenia.

Do zdalnej walidacji CLI przekaż poświadczenia jawnie:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Nie zakładaj, że poświadczenia z lokalnej konfiguracji mają zastosowanie do jawnego zdalnego URL.

## Minimalna bezpieczna baza

Użyj tej postaci jako punktu wyjścia dla eksponowanych wdrożeń:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Następnie poszerzaj po jednym zabezpieczeniu naraz. Na przykład dodaj konkretną listę dozwolonych dla kanału
przed włączeniem narzędzi zdolnych do zapisu albo włącz reverse proxy przed akceptowaniem
zdalnego ruchu Control UI.

Ścisła baza `exec.security: "deny"` blokuje wszystkie wywołania exec, w tym
nieszkodliwą diagnostykę. Jeśli diagnostyka lub polecenia niskiego ryzyka są wymagane, złagodź to
dopiero po wybraniu konkretnych nadawców, agentów, poleceń i trybu zatwierdzania
zgodnych z Twoim modelem zagrożeń.

## Ekspozycja wiadomości prywatnych i grup

Kanały komunikatorów są niezaufanymi powierzchniami wejścia. Przed zezwoleniem na wiadomości prywatne lub grupy:

- Preferuj `dmPolicy: "pairing"` albo ścisłe listy `allowFrom`.
- Unikaj `dmPolicy: "open"`, chyba że każdy nadawca jest zaufany.
- Nie łącz list dozwolonych `"*"` z szerokim dostępem do narzędzi.
- Wymagaj wzmianek w grupach, chyba że pokój jest ściśle kontrolowany.
- Używaj `session.dmScope: "per-channel-peer"`, gdy wiele osób może wysyłać wiadomości prywatne do bota.
- Kieruj współdzielone kanały do agentów z minimalnym zestawem narzędzi i bez osobistych poświadczeń.

Parowanie zatwierdza nadawcę do uruchamiania bota. Nie czyni tego nadawcy
oddzielną granicą bezpieczeństwa hosta.

## Kontrole reverse proxy

Dla proxy świadomych tożsamości:

- Proxy musi uwierzytelniać użytkowników przed przekazaniem ruchu do Gateway.
- Bezpośredni dostęp do portu Gateway musi być zablokowany przez zaporę lub politykę sieciową.
- `gateway.trustedProxies` musi zawierać tylko źródłowe adresy IP proxy.
- Proxy musi usuwać lub nadpisywać nagłówki tożsamości i przekazywania dostarczone przez klienta.
- `gateway.auth.trustedProxy.allowUsers` powinno wymieniać oczekiwanych użytkowników, gdy proxy obsługuje więcej niż jedną grupę odbiorców.
- Tryb proxy na pętli zwrotnej tego samego hosta powinien używać `allowLoopback` tylko wtedy, gdy lokalne procesy są zaufane, a proxy jest właścicielem nagłówków tożsamości.

Uruchom `openclaw security audit --deep` po zmianach proxy. Ustalenia dotyczące zaufanego proxy
są celowo wysokiej jakości sygnałem, ponieważ proxy staje się granicą
uwierzytelniania.

## Przegląd narzędzi i piaskownicy

Przed udostępnieniem agenta zdalnym nadawcom:

- Potwierdź, które sesje działają na hoście, a które w piaskownicy.
- Zabroń exec na hoście albo wymagaj zatwierdzenia.
- Pozostaw narzędzia z podwyższonymi uprawnieniami wyłączone, chyba że potrzebuje ich konkretny, zaufany nadawca.
- Unikaj narzędzi browser, canvas, node, cron, gateway i session-spawn dla otwartych lub półotwartych powierzchni komunikatorów.
- Utrzymuj wąskie montowania bind i unikaj ścieżek poświadczeń, katalogu domowego, gniazda Docker oraz ścieżek systemowych.
- Używaj oddzielnych Gateway, użytkowników systemu operacyjnego lub hostów dla istotnie różnych granic zaufania.

Jeśli zdalni użytkownicy nie są w pełni zaufani, izolacja musi pochodzić z oddzielnych
wdrożeń, a nie tylko z promptów lub etykiet sesji.

## Walidacja po zmianie

Po każdej zmianie ekspozycji:

1. Ponownie uruchom `openclaw security audit --deep`.
2. Przetestuj udane autoryzowane połączenie.
3. Przetestuj, że nieautoryzowany nadawca lub sesja przeglądarki jest odrzucana.
4. Potwierdź, że logi redagują sekrety.
5. Potwierdź, że routing wiadomości prywatnych/grup dociera tylko do zamierzonego agenta.
6. Potwierdź, że narzędzia o dużym wpływie proszą o zatwierdzenie albo są odrzucane.
7. Udokumentuj zaakceptowane ostrzeżenia resztkowe.

Nie przechodź do następnej zmiany ekspozycji, dopóki bieżąca nie jest zrozumiana.

## Plan wycofania

Jeśli Gateway może być nadmiernie wyeksponowany:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Następnie:

1. Zatrzymaj publiczne przekazywanie, Tailscale Funnel lub trasy reverse proxy.
2. Obróć tokeny/hasła Gateway oraz poświadczenia dotkniętych integracji.
3. Usuń `"*"` i nieoczekiwanych nadawców z list dozwolonych.
4. Przejrzyj ostatnie logi audytu, historię uruchomień, wywołania narzędzi i zmiany konfiguracji.
5. Ponownie uruchom `openclaw security audit --deep`.
6. Ponownie włącz dostęp z najwęższym wzorcem spełniającym wymagania przepływu pracy.

## Lista kontrolna przeglądu

- Gateway pozostaje dostępny wyłącznie przez pętlę zwrotną, chyba że istnieje udokumentowany powód.
- Dostęp spoza pętli zwrotnej ma uwierzytelnianie, zaporę i brak publicznej bezpośredniej trasy.
- Wdrożenia z zaufanym proxy mają ścisłe adresy IP proxy i kontrolę nagłówków.
- Wiadomości prywatne używają parowania lub list dozwolonych, a nie domyślnie otwartego dostępu.
- Grupy wymagają wzmianek lub jawnych list dozwolonych.
- Współdzielone kanały nie uzyskują dostępu do osobistych poświadczeń.
- Sesje inne niż główne działają w trybie piaskownicy.
- Exec na hoście i narzędzia z podwyższonymi uprawnieniami są odrzucane albo bramkowane zatwierdzeniem.
- Logi redagują sekrety.
- Krytyczne ustalenia audytu są rozwiązane.
- Kroki wycofania są przetestowane i udokumentowane.
