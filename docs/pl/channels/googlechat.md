---
read_when:
    - Praca nad funkcjami kanału Google Chat
summary: Stan obsługi, możliwości i konfiguracja aplikacji Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T08:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

Status: gotowe dla DM + spaces przez webhooki Google Chat API (tylko HTTP).

## Szybka konfiguracja (dla początkujących)

1. Utwórz projekt Google Cloud i włącz **Google Chat API**.
   - Przejdź do: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Włącz API, jeśli nie jest jeszcze włączone.
2. Utwórz **Service Account**:
   - Kliknij **Create Credentials** > **Service Account**.
   - Nadaj mu dowolną nazwę (np. `openclaw-chat`).
   - Pozostaw uprawnienia puste (kliknij **Continue**).
   - Pozostaw listę principalów z dostępem pustą (kliknij **Done**).
3. Utwórz i pobierz **JSON Key**:
   - Na liście kont usługi kliknij konto, które właśnie utworzono.
   - Przejdź do karty **Keys**.
   - Kliknij **Add Key** > **Create new key**.
   - Wybierz **JSON** i kliknij **Create**.
4. Zapisz pobrany plik JSON na hoście Gateway (np. `~/.openclaw/googlechat-service-account.json`).
5. Utwórz aplikację Google Chat w [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Uzupełnij **Application info**:
     - **App name**: (np. `OpenClaw`)
     - **Avatar URL**: (np. `https://openclaw.ai/logo.png`)
     - **Description**: (np. `Personal AI Assistant`)
   - Włącz **Interactive features**.
   - W sekcji **Functionality** zaznacz **Join spaces and group conversations**.
   - W sekcji **Connection settings** wybierz **HTTP endpoint URL**.
   - W sekcji **Triggers** wybierz **Use a common HTTP endpoint URL for all triggers** i ustaw go na publiczny URL twojego Gateway z dopisanym `/googlechat`.
     - _Wskazówka: uruchom `openclaw status`, aby znaleźć publiczny URL swojego Gateway._
   - W sekcji **Visibility** zaznacz **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Wpisz swój adres e-mail (np. `user@example.com`) w polu tekstowym.
   - Kliknij **Save** na dole strony.
6. **Włącz status aplikacji**:
   - Po zapisaniu **odśwież stronę**.
   - Znajdź sekcję **App status** (zwykle u góry lub na dole po zapisaniu).
   - Zmień status na **Live - available to users**.
   - Kliknij ponownie **Save**.
7. Skonfiguruj OpenClaw, podając ścieżkę do konta usługi i odbiorcę webhooka:
   - Zmienna środowiskowa: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Lub konfiguracja: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Ustaw typ i wartość odbiorcy webhooka (`audience`) zgodnie z konfiguracją aplikacji Chat.
9. Uruchom Gateway. Google Chat będzie wysyłać żądania POST na ścieżkę twojego webhooka.

## Dodawanie do Google Chat

Gdy Gateway działa, a twój adres e-mail został dodany do listy widoczności:

1. Przejdź do [Google Chat](https://chat.google.com/).
2. Kliknij ikonę **+** obok **Direct Messages**.
3. W pasku wyszukiwania (tam, gdzie zwykle dodajesz osoby) wpisz **App name** skonfigurowaną w Google Cloud Console.
   - **Uwaga**: bot _nie_ pojawi się na liście przeglądania „Marketplace”, ponieważ jest to aplikacja prywatna. Musisz wyszukać ją po nazwie.
4. Wybierz bota z wyników.
5. Kliknij **Add** lub **Chat**, aby rozpocząć rozmowę 1:1.
6. Wyślij „Hello”, aby uruchomić asystenta!

## Publiczny URL (tylko Webhook)

Webhooki Google Chat wymagają publicznego punktu końcowego HTTPS. Ze względów bezpieczeństwa **wystawiaj do internetu tylko ścieżkę `/googlechat`**. Zachowaj dashboard OpenClaw i inne wrażliwe punkty końcowe w prywatnej sieci.

### Opcja A: Tailscale Funnel (zalecane)

Użyj Tailscale Serve dla prywatnego dashboardu i Funnel dla publicznej ścieżki webhooka. Dzięki temu `/` pozostaje prywatne, a publicznie wystawione jest tylko `/googlechat`.

1. **Sprawdź, z jakim adresem jest związany twój Gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Zanotuj adres IP (np. `127.0.0.1`, `0.0.0.0` lub twój adres Tailscale, np. `100.x.x.x`).

2. **Wystaw dashboard tylko do tailnetu (port 8443):**

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

4. **Autoryzuj węzeł do korzystania z Funnel:**
   Jeśli pojawi się monit, odwiedź URL autoryzacji pokazany w danych wyjściowych, aby włączyć Funnel dla tego węzła w polityce twojego tailnetu.

5. **Zweryfikuj konfigurację:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Twój publiczny URL webhooka będzie miał postać:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Twój prywatny dashboard pozostanie dostępny tylko w tailnecie:
`https://<node-name>.<tailnet>.ts.net:8443/`

Użyj publicznego URL (bez `:8443`) w konfiguracji aplikacji Google Chat.

> Uwaga: ta konfiguracja jest zachowywana po ponownym uruchomieniu systemu. Aby ją później usunąć, uruchom `tailscale funnel reset` i `tailscale serve reset`.

### Opcja B: Reverse Proxy (Caddy)

Jeśli używasz reverse proxy, takiego jak Caddy, przekazuj tylko określoną ścieżkę:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Przy tej konfiguracji każde żądanie do `your-domain.com/` zostanie zignorowane lub zwróci 404, a `your-domain.com/googlechat` zostanie bezpiecznie przekierowane do OpenClaw.

### Opcja C: Cloudflare Tunnel

Skonfiguruj reguły ingress tunelu tak, aby kierowały tylko ścieżkę webhooka:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Jak to działa

1. Google Chat wysyła żądania POST webhooka do Gateway. Każde żądanie zawiera nagłówek `Authorization: Bearer <token>`.
   - OpenClaw weryfikuje autoryzację bearer przed odczytem/parsowaniem pełnych treści webhooka, jeśli nagłówek jest obecny.
   - Żądania Google Workspace Add-on zawierające `authorizationEventObject.systemIdToken` w treści są obsługiwane przez bardziej restrykcyjny limit rozmiaru treści przed autoryzacją.
2. OpenClaw weryfikuje token względem skonfigurowanych `audienceType` i `audience`:
   - `audienceType: "app-url"` → odbiorcą jest URL twojego webhooka HTTPS.
   - `audienceType: "project-number"` → odbiorcą jest numer projektu Cloud.
3. Wiadomości są kierowane według space:
   - DM używają klucza sesji `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Spaces używają klucza sesji `agent:<agentId>:googlechat:group:<spaceId>`.
4. Dostęp do DM domyślnie używa parowania. Nieznani nadawcy otrzymują kod parowania; zatwierdź go poleceniem:
   - `openclaw pairing approve googlechat <code>`
5. Group spaces domyślnie wymagają wzmianki `@`. Użyj `botUser`, jeśli wykrywanie wzmianki wymaga nazwy użytkownika aplikacji.

## Cele

Używaj tych identyfikatorów do dostarczania i list dozwolonych:

- Wiadomości bezpośrednie: `users/<userId>` (zalecane).
- Surowy adres e-mail `name@example.com` jest zmienny i jest używany tylko do bezpośredniego dopasowania listy dozwolonych, gdy `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Przestarzałe: `users/<email>` jest traktowane jako identyfikator użytkownika, a nie wpis listy dozwolonych oparty na adresie e-mail.
- Spaces: `spaces/<spaceId>`.

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
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
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

- Poświadczenia konta usługi można również przekazać inline przez `serviceAccount` (ciąg JSON).
- `serviceAccountRef` jest również obsługiwane (env/file SecretRef), w tym odwołania per konto w `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Domyślna ścieżka webhooka to `/googlechat`, jeśli `webhookPath` nie jest ustawione.
- `dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych principalów e-mail dla list dozwolonych (tryb zgodności awaryjnej).
- Reakcje są dostępne przez narzędzie `reactions` i `channels action`, gdy `actions.reactions` jest włączone.
- Akcje wiadomości udostępniają `send` dla tekstu oraz `upload-file` do jawnego wysyłania załączników. `upload-file` akceptuje `media` / `filePath` / `path` oraz opcjonalnie `message`, `filename` i kierowanie do wątku.
- `typingIndicator` obsługuje `none`, `message` (domyślnie) i `reaction` (reakcja wymaga OAuth użytkownika).
- Załączniki są pobierane przez Chat API i zapisywane w pipeline mediów (rozmiar ograniczony przez `mediaMaxMb`).

Szczegóły odwołań do sekretów: [Zarządzanie sekretami](/pl/gateway/secrets).

## Rozwiązywanie problemów

### 405 Method Not Allowed

Jeśli Google Cloud Logs Explorer pokazuje błędy takie jak:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Oznacza to, że handler webhooka nie jest zarejestrowany. Typowe przyczyny:

1. **Kanał nie jest skonfigurowany**: w konfiguracji brakuje sekcji `channels.googlechat`. Zweryfikuj to poleceniem:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jeśli zwraca „Config path not found”, dodaj konfigurację (zobacz [Najważniejsze elementy konfiguracji](#config-highlights)).

2. **Plugin nie jest włączony**: sprawdź stan Pluginu:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jeśli widzisz „disabled”, dodaj `plugins.entries.googlechat.enabled: true` do konfiguracji.

3. **Gateway nie został ponownie uruchomiony**: po dodaniu konfiguracji uruchom ponownie Gateway:

   ```bash
   openclaw gateway restart
   ```

Sprawdź, czy kanał działa:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Inne problemy

- Sprawdź `openclaw channels status --probe`, aby wykryć błędy autoryzacji lub brakującą konfigurację `audience`.
- Jeśli nie docierają żadne wiadomości, potwierdź URL webhooka aplikacji Chat i subskrypcje zdarzeń.
- Jeśli blokowanie przez wymóg wzmianki uniemożliwia odpowiedzi, ustaw `botUser` na nazwę zasobu użytkownika aplikacji i zweryfikuj `requireMention`.
- Użyj `openclaw logs --follow` podczas wysyłania wiadomości testowej, aby sprawdzić, czy żądania docierają do Gateway.

Powiązana dokumentacja:

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Bezpieczeństwo](/pl/gateway/security)
- [Reakcje](/pl/tools/reactions)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i blokowanie przez wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
