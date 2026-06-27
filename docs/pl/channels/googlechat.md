---
read_when:
    - Praca nad funkcjami kanału Google Chat
summary: Status obsługi aplikacji Google Chat, możliwości i konfiguracja
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T17:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

Status: Plugin do pobrania dla DM + przestrzeni przez webhooki Google Chat API (tylko HTTP).

## Instalacja

Zainstaluj Google Chat przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/googlechat
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Szybka konfiguracja (dla początkujących)

1. Utwórz projekt Google Cloud i włącz **Google Chat API**.
   - Przejdź do: [Poświadczenia Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Włącz API, jeśli nie jest jeszcze włączone.
2. Utwórz **konto usługi**:
   - Naciśnij **Utwórz dane logowania** > **Konto usługi**.
   - Nazwij je dowolnie (np. `openclaw-chat`).
   - Pozostaw uprawnienia puste (naciśnij **Dalej**).
   - Pozostaw konta z dostępem puste (naciśnij **Gotowe**).
3. Utwórz i pobierz **klucz JSON**:
   - Na liście kont usług kliknij konto, które właśnie utworzono.
   - Przejdź do karty **Klucze**.
   - Kliknij **Dodaj klucz** > **Utwórz nowy klucz**.
   - Wybierz **JSON** i naciśnij **Utwórz**.
4. Zapisz pobrany plik JSON na hoście gateway (np. `~/.openclaw/googlechat-service-account.json`).
5. Utwórz aplikację Google Chat w [konfiguracji Chat w Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Wypełnij **Informacje o aplikacji**:
     - **Nazwa aplikacji**: (np. `OpenClaw`)
     - **Adres URL awatara**: (np. `https://openclaw.ai/logo.png`)
     - **Opis**: (np. `Personal AI Assistant`)
   - Włącz **Funkcje interaktywne**.
   - W sekcji **Funkcjonalność** zaznacz **Dołączanie do przestrzeni i rozmów grupowych**.
   - W sekcji **Ustawienia połączenia** wybierz **Adres URL punktu końcowego HTTP**.
   - W sekcji **Wyzwalacze** wybierz **Użyj wspólnego adresu URL punktu końcowego HTTP dla wszystkich wyzwalaczy** i ustaw go na publiczny adres URL gateway z dodanym `/googlechat`.
     - _Wskazówka: Uruchom `openclaw status`, aby znaleźć publiczny adres URL gateway._
   - W sekcji **Widoczność** zaznacz **Udostępnij tę aplikację Chat określonym osobom i grupom w `<Your Domain>`**.
   - Wpisz swój adres e-mail (np. `user@example.com`) w polu tekstowym.
   - Kliknij **Zapisz** na dole.
6. **Włącz status aplikacji**:
   - Po zapisaniu **odśwież stronę**.
   - Znajdź sekcję **Status aplikacji** (zwykle u góry lub u dołu po zapisaniu).
   - Zmień status na **Live - available to users**.
   - Ponownie kliknij **Zapisz**.
7. Skonfiguruj OpenClaw ze ścieżką do konta usługi + odbiorcą webhooka:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Albo konfiguracja: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Ustaw typ i wartość odbiorcy webhooka (zgodne z konfiguracją aplikacji Chat).
9. Uruchom gateway. Google Chat będzie wysyłać POST na ścieżkę webhooka.

## Dodawanie do Google Chat

Gdy gateway działa, a Twój e-mail jest dodany do listy widoczności:

1. Przejdź do [Google Chat](https://chat.google.com/).
2. Kliknij ikonę **+** (plus) obok **Wiadomości bezpośrednie**.
3. W pasku wyszukiwania (tam, gdzie zwykle dodaje się osoby), wpisz **nazwę aplikacji** skonfigurowaną w Google Cloud Console.
   - **Uwaga**: Bot _nie_ pojawi się na liście przeglądania „Marketplace”, ponieważ jest aplikacją prywatną. Musisz wyszukać go po nazwie.
4. Wybierz bota z wyników.
5. Kliknij **Dodaj** albo **Czat**, aby rozpocząć rozmowę 1:1.
6. Wyślij „Hello”, aby uruchomić asystenta!

## Publiczny adres URL (tylko Webhook)

Webhooki Google Chat wymagają publicznego punktu końcowego HTTPS. Ze względów bezpieczeństwa **wystaw do internetu tylko ścieżkę `/googlechat`**. Zachowaj panel OpenClaw i inne wrażliwe punkty końcowe w sieci prywatnej.

### Opcja A: Tailscale Funnel (zalecane)

Użyj Tailscale Serve dla prywatnego panelu i Funnel dla publicznej ścieżki webhooka. Dzięki temu `/` pozostaje prywatne, a wystawione jest tylko `/googlechat`.

1. **Sprawdź, z jakim adresem jest powiązany gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Zanotuj adres IP (np. `127.0.0.1`, `0.0.0.0` albo swój adres IP Tailscale, taki jak `100.x.x.x`).

2. **Wystaw panel tylko w tailnet (port 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Wystaw publicznie tylko ścieżkę webhooka:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autoryzuj węzeł do dostępu Funnel:**
   Jeśli pojawi się monit, odwiedź adres URL autoryzacji pokazany w wyniku, aby włączyć Funnel dla tego węzła w polityce tailnet.

5. **Zweryfikuj konfigurację:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Publiczny adres URL webhooka będzie mieć postać:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Prywatny panel pozostaje dostępny tylko w tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Użyj publicznego adresu URL (bez `:8443`) w konfiguracji aplikacji Google Chat.

> Uwaga: Ta konfiguracja przetrwa ponowne uruchomienia. Aby usunąć ją później, uruchom `tailscale funnel reset` i `tailscale serve reset`.

### Opcja B: Odwrotny serwer proxy (Caddy)

Jeśli używasz odwrotnego serwera proxy, takiego jak Caddy, przekieruj tylko konkretną ścieżkę:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Przy tej konfiguracji każde żądanie do `your-domain.com/` zostanie zignorowane albo zwróci 404, natomiast `your-domain.com/googlechat` zostanie bezpiecznie skierowane do OpenClaw.

### Opcja C: Cloudflare Tunnel

Skonfiguruj reguły ingress tunelu tak, aby kierowały tylko ścieżkę webhooka:

- **Ścieżka**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Reguła domyślna**: HTTP 404 (Nie znaleziono)

## Jak to działa

1. Google Chat wysyła żądania POST webhooka do gateway. Każde żądanie zawiera nagłówek `Authorization: Bearer <token>`.
   - OpenClaw weryfikuje uwierzytelnianie bearer przed odczytem/parsowaniem pełnych treści webhooka, gdy nagłówek jest obecny.
   - Żądania Google Workspace Add-on, które przenoszą `authorizationEventObject.systemIdToken` w treści, są obsługiwane przy użyciu bardziej rygorystycznego budżetu treści przed uwierzytelnieniem.
2. OpenClaw weryfikuje token względem skonfigurowanych `audienceType` + `audience`:
   - `audienceType: "app-url"` → odbiorcą jest adres URL HTTPS webhooka.
   - `audienceType: "project-number"` → odbiorcą jest numer projektu Cloud.
3. Wiadomości są kierowane według przestrzeni:
   - DM używają klucza sesji `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Przestrzenie używają klucza sesji `agent:<agentId>:googlechat:group:<spaceId>`.
4. Dostęp do DM domyślnie działa przez parowanie. Nieznani nadawcy otrzymują kod parowania; zatwierdź go poleceniem:
   - `openclaw pairing approve googlechat <code>`
5. Przestrzenie grupowe domyślnie wymagają wzmianki @. Użyj `botUser`, jeśli wykrywanie wzmianek wymaga nazwy użytkownika aplikacji.
6. Gdy żądanie zatwierdzenia exec lub Plugin rozpoczyna się z Google Chat i skonfigurowany jest stabilny zatwierdzający `users/<id>`, OpenClaw publikuje natywną kartę zatwierdzenia Google Chat w przestrzeni lub wątku źródłowym. Przyciski karty używają nieprzezroczystych tokenów callback, a ręczny monit `/approve <id> <decision>` jest wyświetlany tylko wtedy, gdy natywne dostarczanie zatwierdzeń jest niedostępne.

## Cele

Używaj tych identyfikatorów do dostarczania i list dozwolonych:

- Wiadomości bezpośrednie: `users/<userId>` (zalecane).
- Surowy e-mail `name@example.com` jest zmienny i używany tylko do dopasowywania bezpośredniej listy dozwolonych, gdy `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Przestarzałe: `users/<email>` jest traktowane jako identyfikator użytkownika, a nie lista dozwolonych adresów e-mail.
- Przestrzenie: `spaces/<spaceId>`.

## Najważniejsze elementy konfiguracji

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Uwagi:

- Poświadczenia konta usługi można także przekazać inline przez `serviceAccount` (ciąg JSON).
- Obsługiwany jest także `serviceAccountRef` (env/file SecretRef), w tym referencje dla poszczególnych kont pod `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Domyślna ścieżka webhooka to `/googlechat`, jeśli `webhookPath` nie jest ustawione.
- `dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych pryncypałów e-mail dla list dozwolonych (tryb zgodności break-glass).
- Reakcje są dostępne przez narzędzie `reactions` i `channels action`, gdy `actions.reactions` jest włączone.
- Natywne karty zatwierdzeń używają kliknięć przycisków Google Chat `cardsV2`, a nie zdarzeń reakcji. Zatwierdzający pochodzą z `dm.allowFrom` albo `defaultTo` i muszą być stabilnymi numerycznymi wartościami `users/<id>`.
- Akcje wiadomości udostępniają `send` dla tekstu oraz `upload-file` dla jawnego wysyłania załączników. `upload-file` przyjmuje `media` / `filePath` / `path` oraz opcjonalne `message`, `filename` i wskazanie wątku docelowego.
- `typingIndicator` obsługuje `message` (domyślne), `none` i `reaction` (reakcja wymaga OAuth użytkownika).
- Załączniki są pobierane przez Chat API i przechowywane w potoku mediów (rozmiar ograniczony przez `mediaMaxMb`).
- Wiadomości Google Chat autorstwa botów są domyślnie ignorowane. Jeśli celowo ustawisz `allowBots: true`, zaakceptowane wiadomości autorstwa botów używają wspólnej [ochrony przed pętlą botów](/pl/channels/bot-loop-protection). Skonfiguruj `channels.defaults.botLoopProtection`, a następnie nadpisz przez `channels.googlechat.botLoopProtection` albo `channels.googlechat.groups.<space>.botLoopProtection`, gdy jedna przestrzeń wymaga innego budżetu.

Szczegóły referencji sekretów: [Zarządzanie sekretami](/pl/gateway/secrets).

## Rozwiązywanie problemów

### 405 Method Not Allowed

Jeśli Google Cloud Logs Explorer pokazuje błędy takie jak:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Oznacza to, że handler webhooka nie jest zarejestrowany. Typowe przyczyny:

1. **Kanał nie jest skonfigurowany**: Brakuje sekcji `channels.googlechat` w konfiguracji. Zweryfikuj poleceniem:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jeśli zwraca „Config path not found”, dodaj konfigurację (zobacz [najważniejsze elementy konfiguracji](#config-highlights)).

2. **Plugin nie jest włączony**: Sprawdź status Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jeśli pokazuje „disabled”, dodaj `plugins.entries.googlechat.enabled: true` do konfiguracji.

3. **Gateway nie został ponownie uruchomiony**: Po dodaniu konfiguracji uruchom ponownie gateway:

   ```bash
   openclaw gateway restart
   ```

Zweryfikuj, że kanał działa:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Inne problemy

- Sprawdź `openclaw channels status --probe` pod kątem błędów uwierzytelniania lub brakującej konfiguracji odbiorcy.
- Jeśli wiadomości nie docierają, potwierdź adres URL webhooka aplikacji Chat + subskrypcje zdarzeń.
- Jeśli bramka wzmianek blokuje odpowiedzi, ustaw `botUser` na nazwę zasobu użytkownika aplikacji i zweryfikuj `requireMention`.
- Użyj `openclaw logs --follow` podczas wysyłania wiadomości testowej, aby sprawdzić, czy żądania docierają do gateway.

Powiązane dokumenty:

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Bezpieczeństwo](/pl/gateway/security)
- [Reakcje](/pl/tools/reactions)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i kontrola wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
