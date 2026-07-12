---
read_when:
    - Udostępnianie Gateway przez LAN, tailnet, Tailscale Serve, Funnel lub odwrotne proxy
    - Weryfikacja wdrożenia przed udostępnieniem go rzeczywistym użytkownikom komunikatora
    - Wycofywanie ryzykownej konfiguracji dostępu zdalnego lub wiadomości prywatnych
sidebarTitle: Exposure runbook
summary: Lista kontrolna przed wdrożeniem i wycofaniem zmian przed udostępnieniem OpenClaw Gateway poza interfej local loopback
title: Podręcznik udostępniania Gateway
x-i18n:
    generated_at: "2026-07-12T15:08:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Udostępnij Gateway dopiero wtedy, gdy potrafisz wyjaśnić, kto może uzyskać do niego dostęp, jak jest
uwierzytelniany, których agentów może uruchamiać i z jakich narzędzi ci agenci mogą
korzystać. W razie wątpliwości przywróć dostęp wyłącznie przez local loopback i ponownie przeprowadź audyt.
</Warning>

Ten podręcznik operacyjny przekształca ogólne wytyczne dotyczące [bezpieczeństwa](/pl/gateway/security) w
listę kontrolną dla operatora dotyczącą zdalnego dostępu i udostępniania komunikacji.

## Wybierz model udostępniania

Preferuj najwęższy model spełniający wymagania przepływu pracy.

| Model                      | Zalecany, gdy                                           | Wymagane zabezpieczenia                                                                                                                             |
| -------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local loopback + tunel SSH | Użytek osobisty, dostęp administracyjny, debugowanie    | Zachowaj `gateway.bind: "loopback"` i utwórz tunel do `127.0.0.1:18789`                                                                              |
| Local loopback + Tailscale Serve | Osobisty dostęp z sieci tailnet do interfejsu Control UI/WebSocket | Zachowaj dostęp do Gateway wyłącznie przez local loopback; nagłówki tożsamości Tailscale uwierzytelniają tylko interfejs WebSocket Control UI, a nie inne ścieżki uwierzytelniania |
| Powiązanie z tailnet/LAN   | Dedykowana sieć prywatna ze znanymi urządzeniami        | Uwierzytelnianie Gateway, lista dozwolonych w zaporze, bez publicznego przekierowania portów                                                         |
| Zaufane odwrotne proxy     | SSO/OIDC organizacji przed Gateway                      | Uwierzytelnianie `trusted-proxy`, ścisła lista `trustedProxies`, reguły zastępowania/usuwania nagłówków, jawnie określeni dozwoleni użytkownicy      |
| Internet publiczny         | Rzadkie wdrożenia o wysokim ryzyku                      | Proxy rozpoznające tożsamość, TLS, limity częstotliwości, ścisłe listy dozwolonych, izolowane sesje inne niż główna                                  |

Unikaj bezpośredniego publicznego przekierowania portów do Gateway. Jeśli dostęp publiczny jest
wymagany, umieść przed nim proxy rozpoznające tożsamość i spraw, aby proxy było
jedyną ścieżką sieciową do Gateway.

## Inwentaryzacja przed wdrożeniem

Przed zmianą zasad powiązania, proxy, Tailscale lub kanału zapisz:

- Host Gateway, użytkownika systemu operacyjnego i katalog stanu (domyślnie `~/.openclaw`).
- Adres URL Gateway i tryb powiązania (`gateway.bind`; domyślny port `18789`).
- Tryb uwierzytelniania, źródło tokenu/hasła lub źródło tożsamości zaufanego proxy.
- Każdy włączony kanał oraz informację, czy przyjmuje wiadomości prywatne, grupy lub elementy Webhook.
- Agentów dostępnych dla nadawców spoza hosta lokalnego.
- Profil narzędzi, tryb izolacji i zasady narzędzi z podwyższonymi uprawnieniami dla każdego dostępnego agenta.
- Zewnętrzne dane uwierzytelniające dostępne dla tych agentów.
- Lokalizację kopii zapasowej `~/.openclaw/openclaw.json` i danych uwierzytelniających.

Jeśli więcej niż jedna osoba może wysyłać wiadomości do bota, traktuj to jako współdzielone, delegowane
uprawnienie do korzystania z narzędzi, a nie izolację hosta dla poszczególnych użytkowników.

## Kontrole bazowe

Uruchom przed udostępnieniem dostępu:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Najpierw usuń krytyczne problemy. Akceptuj ostrzeżenia tylko wtedy, gdy są zamierzone i
udokumentowane dla danego wdrożenia. Znaczenie każdego `checkId` i odpowiadającego mu klucza naprawy opisano w
[Kontrolach audytu bezpieczeństwa](/pl/gateway/security/audit-checks).

W celu zdalnej weryfikacji przez CLI przekaż jawnie dane uwierzytelniające:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Nie zakładaj, że dane uwierzytelniające z konfiguracji lokalnej mają zastosowanie do jawnie podanego zdalnego adresu URL.

## Minimalna bezpieczna konfiguracja bazowa

Użyj tej konfiguracji jako punktu wyjścia dla udostępnianych wdrożeń:

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

Rozszerzaj po jednym zabezpieczeniu naraz: dodaj konkretną listę dozwolonych dla kanału przed włączeniem
narzędzi umożliwiających zapis albo włącz odwrotne proxy przed rozpoczęciem przyjmowania zdalnego ruchu
Control UI.

`tools.exec.security: "deny"` blokuje wszystkie wywołania exec, w tym nieszkodliwą
diagnostykę. Jeśli diagnostyka lub polecenia niskiego ryzyka są wymagane, złagodź to ustawienie dopiero
po wybraniu konkretnych nadawców, agentów, poleceń i trybu zatwierdzania zgodnych
z modelem zagrożeń.

## Udostępnianie wiadomości prywatnych i grup

Kanały komunikacyjne są powierzchniami przyjmującymi niezaufane dane wejściowe. Przed zezwoleniem na wiadomości prywatne lub
grupy:

- Preferuj `dmPolicy: "pairing"` lub ścisłą listę `allowFrom` zamiast `dmPolicy: "open"`.
- Nie łącz list dozwolonych zawierających `"*"` z szerokim dostępem do narzędzi.
- Wymagaj wzmianek w grupach, chyba że pokój jest ściśle kontrolowany.
- Ustaw `session.dmScope: "per-channel-peer"` (lub `"per-account-channel-peer"` dla
  kanałów z wieloma kontami), gdy wiele osób może wysyłać botowi wiadomości prywatne, aby sesje wiadomości prywatnych
  nie współdzieliły kontekstu.
- Kieruj współdzielone kanały do agentów z minimalnym zestawem narzędzi i bez osobistych
  danych uwierzytelniających.

Parowanie zatwierdza nadawcę do uruchamiania bota. Nie czyni tego nadawcy
odrębną granicą bezpieczeństwa hosta.

## Kontrole odwrotnego proxy

W przypadku proxy rozpoznających tożsamość:

- Proxy musi uwierzytelniać użytkowników przed przekazaniem ruchu do Gateway.
- Zapora lub zasady sieciowe muszą blokować bezpośredni dostęp do portu Gateway.
- `gateway.trustedProxies` musi zawierać wyłącznie źródłowe adresy IP proxy.
- Proxy musi usuwać lub zastępować dostarczone przez klienta nagłówki tożsamości i
  przekazywania.
- Ustaw `gateway.auth.trustedProxy.allowUsers`, gdy proxy obsługuje więcej niż
  jedną grupę odbiorców.
- Używaj `gateway.auth.trustedProxy.allowLoopback` tylko w przypadku proxy działającego na tym samym hoście,
  gdy procesy lokalne są zaufane, a proxy kontroluje nagłówki tożsamości.

Po zmianach proxy uruchom `openclaw security audit --deep`. Ustalenia dotyczące
zaufanego proxy mają dużą wartość diagnostyczną, ponieważ proxy staje się granicą
uwierzytelniania.

## Przegląd narzędzi i izolacji

Przed udostępnieniem agenta zdalnym nadawcom:

- Sprawdź, które sesje działają na hoście, a które w izolacji.
- Zabroń wykonywania poleceń na hoście lub wymagaj ich zatwierdzania.
- Pozostaw narzędzia z podwyższonymi uprawnieniami wyłączone, chyba że potrzebuje ich konkretny, zaufany nadawca.
- Unikaj narzędzi przeglądarki, canvas, node, cron, gateway i tworzenia sesji na otwartych
  lub częściowo otwartych powierzchniach komunikacyjnych.
- Ogranicz punkty montowania; unikaj ścieżek do danych uwierzytelniających, katalogu domowego, gniazda Docker i ścieżek
  systemowych.
- Używaj oddzielnych instancji Gateway, użytkowników systemu operacyjnego lub hostów dla istotnie różnych granic
  zaufania.

Jeśli zdalni użytkownicy nie są w pełni zaufani, izolacja musi wynikać z oddzielnych
wdrożeń, a nie tylko z promptów lub etykiet sesji.

## Weryfikacja po zmianach

Po każdej zmianie udostępniania:

1. Ponownie uruchom `openclaw security audit --deep`.
2. Potwierdź, że autoryzowane połączenie zostaje pomyślnie nawiązane.
3. Potwierdź, że nieautoryzowany nadawca lub sesja przeglądarki zostaje odrzucona.
4. Potwierdź, że dzienniki ukrywają dane poufne.
5. Potwierdź, że routing wiadomości prywatnych/grup kieruje je wyłącznie do zamierzonego agenta.
6. Potwierdź, że narzędzia o dużym wpływie wymagają zatwierdzenia lub są blokowane.
7. Udokumentuj zaakceptowane ostrzeżenia dotyczące ryzyka rezydualnego.

Nie przechodź do następnej zmiany udostępniania, dopóki bieżąca nie zostanie
w pełni zrozumiana.

## Plan wycofania zmian

Jeśli Gateway może być nadmiernie udostępniony:

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

1. Zatrzymaj publiczne przekierowanie, Tailscale Funnel lub trasy odwrotnego proxy.
2. Zmień tokeny/hasła Gateway oraz dane uwierzytelniające powiązanych integracji.
3. Usuń `"*"` i nieoczekiwanych nadawców z list dozwolonych.
4. Przejrzyj ostatnie dzienniki audytu, historię uruchomień, wywołania narzędzi i zmiany konfiguracji.
5. Ponownie uruchom `openclaw security audit --deep`.
6. Ponownie włącz dostęp przy użyciu najwęższego modelu spełniającego wymagania przepływu pracy.

## Lista kontrolna przeglądu

- Gateway pozostaje dostępny wyłącznie przez local loopback, chyba że istnieje udokumentowany powód zmiany.
- Dostęp spoza local loopback ma uwierzytelnianie, zabezpieczenie zaporą i nie ma bezpośredniej trasy publicznej.
- Wdrożenia z zaufanym proxy mają ściśle określone adresy IP proxy i kontrolę nagłówków.
- Wiadomości prywatne domyślnie używają parowania lub list dozwolonych, a nie otwartego dostępu.
- Grupy wymagają wzmianek lub jawnych list dozwolonych.
- Współdzielone kanały nie mają dostępu do osobistych danych uwierzytelniających.
- Sesje inne niż główna działają w trybie izolacji.
- Wykonywanie poleceń na hoście i narzędzia z podwyższonymi uprawnieniami są zabronione lub wymagają zatwierdzenia.
- Dzienniki ukrywają dane poufne.
- Krytyczne ustalenia audytu zostały usunięte.
- Kroki wycofania zmian zostały przetestowane i udokumentowane.
