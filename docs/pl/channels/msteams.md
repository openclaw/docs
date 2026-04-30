---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Status obsługi bota Microsoft Teams, możliwości i konfiguracja
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T09:38:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

Status: tekst + załączniki DM są obsługiwane; wysyłanie plików w kanałach/grupach wymaga `sharePointSiteId` + uprawnień Graph (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane przez Adaptive Cards. Akcje wiadomości udostępniają jawne `upload-file` dla wysyłek najpierw z plikiem.

## Dołączony Plugin

Microsoft Teams jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc w normalnej spakowanej kompilacji nie jest wymagana osobna instalacja.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza dołączony Teams, zainstaluj aktualny pakiet npm, gdy zostanie opublikowany:

```bash
openclaw plugins install @openclaw/msteams
```

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, użyj aktualnej spakowanej kompilacji OpenClaw albo lokalnej ścieżki checkoutu, dopóki nowszy pakiet npm nie zostanie opublikowany.

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) obsługuje rejestrację bota, tworzenie manifestu i generowanie poświadczeń jednym poleceniem.

**1. Zainstaluj i zaloguj się**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI jest obecnie w wersji preview. Polecenia i flagi mogą zmieniać się między wydaniami.
</Note>

**2. Uruchom tunel** (Teams nie może połączyć się z localhost)

Zainstaluj i uwierzytelnij devtunnel CLI, jeśli jeszcze tego nie zrobiono ([przewodnik rozpoczęcia pracy](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` jest wymagane, ponieważ Teams nie może uwierzytelniać się w devtunnels. Każde przychodzące żądanie bota nadal jest automatycznie weryfikowane przez Teams SDK.
</Note>

Alternatywy: `ngrok http 3978` lub `tailscale funnel 3978` (ale mogą one zmieniać adresy URL w każdej sesji).

**3. Utwórz aplikację**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

To pojedyncze polecenie:

- Tworzy aplikację Entra ID (Azure AD)
- Generuje sekret klienta
- Buduje i przesyła manifest aplikacji Teams (z ikonami)
- Rejestruje bota (domyślnie zarządzanego przez Teams — subskrypcja Azure nie jest potrzebna)

Wynik pokaże `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` oraz **Teams App ID** — zanotuj je na potrzeby kolejnych kroków. Zaproponuje też bezpośrednią instalację aplikacji w Teams.

**4. Skonfiguruj OpenClaw** przy użyciu poświadczeń z wyniku:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Możesz też użyć bezpośrednio zmiennych środowiskowych: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Zainstaluj aplikację w Teams**

`teams app create` poprosi o zainstalowanie aplikacji — wybierz „Install in Teams”. Jeśli ten krok został pominięty, link można uzyskać później:

```bash
teams app get <teamsAppId> --install-link
```

**6. Sprawdź, czy wszystko działa**

```bash
teams app doctor <teamsAppId>
```

Uruchamia to diagnostykę rejestracji bota, konfiguracji aplikacji AAD, poprawności manifestu i konfiguracji SSO.

W przypadku wdrożeń produkcyjnych rozważ użycie [uwierzytelniania federacyjnego](/pl/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certyfikatu lub tożsamości zarządzanej) zamiast sekretów klienta.

<Note>
Czaty grupowe są domyślnie blokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi grupowe, ustaw `channels.msteams.groupAllowFrom` albo użyj `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (z bramką przez wzmiankę).
</Note>

## Cele

- Rozmawiaj z OpenClaw przez DM w Teams, czaty grupowe lub kanały.
- Zachowaj deterministyczne routowanie: odpowiedzi zawsze wracają do kanału, z którego przyszły.
- Domyślnie używaj bezpiecznego zachowania kanałów (wzmianki wymagane, o ile nie skonfigurowano inaczej).

## Zapisy konfiguracji

Domyślnie Microsoft Teams może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz za pomocą:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrola dostępu (DM + grupy)

**Dostęp DM**

- Domyślnie: `channels.msteams.dmPolicy = "pairing"`. Nieznani nadawcy są ignorowani do czasu zatwierdzenia.
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD.
- Nie polegaj na dopasowywaniu UPN/nazwy wyświetlanej dla list dozwolonych — mogą się zmieniać. OpenClaw domyślnie wyłącza bezpośrednie dopasowywanie nazw; włącz je jawnie za pomocą `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozwiązywać nazwy do identyfikatorów przez Microsoft Graph, gdy pozwalają na to poświadczenia.

**Dostęp grupowy**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (blokowane, chyba że dodasz `groupAllowFrom`). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- `channels.msteams.groupAllowFrom` kontroluje, którzy nadawcy mogą wyzwalać działania w czatach grupowych/kanałach (z zapasowym użyciem `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (domyślnie nadal z bramką przez wzmiankę).
- Aby nie zezwalać na **żadne kanały**, ustaw `channels.msteams.groupPolicy: "disabled"`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + lista dozwolonych kanałów**

- Ogranicz odpowiedzi grupowe/kanałowe, wymieniając zespoły i kanały pod `channels.msteams.teams`.
- Klucze powinny używać stabilnych identyfikatorów konwersacji Teams z linków Teams, a nie zmiennych nazw wyświetlanych.
- Gdy `groupPolicy="allowlist"` i obecna jest lista dozwolonych zespołów, akceptowane są tylko wymienione zespoły/kanały (z bramką przez wzmiankę).
- Kreator konfiguracji przyjmuje wpisy `Team/Channel` i zapisuje je za Ciebie.
- Podczas uruchamiania OpenClaw rozwiązuje nazwy zespołów/kanałów oraz użytkowników z list dozwolonych do identyfikatorów (gdy pozwalają na to uprawnienia Graph)
  i loguje mapowanie; nierozwiązane nazwy zespołów/kanałów są zachowywane tak, jak wpisano, ale domyślnie ignorowane przy routowaniu, chyba że włączono `channels.msteams.dangerouslyAllowNameMatching: true`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>Konfiguracja ręczna (bez Teams CLI)</strong></summary>

Jeśli nie możesz użyć Teams CLI, możesz ręcznie skonfigurować bota przez Azure Portal.

### Jak to działa

1. Upewnij się, że Microsoft Teams Plugin jest dostępny (dołączony w bieżących wydaniach).
2. Utwórz **Azure Bot** (App ID + sekret + tenant ID).
3. Zbuduj **pakiet aplikacji Teams**, który odwołuje się do bota i zawiera poniższe uprawnienia RSC.
4. Prześlij/zainstaluj aplikację Teams w zespole (lub w zakresie osobistym dla DM).
5. Skonfiguruj `msteams` w `~/.openclaw/openclaw.json` (lub zmiennych środowiskowych) i uruchom Gateway.
6. Gateway domyślnie nasłuchuje ruchu Webhook Bot Framework pod `/api/messages`.

### Krok 1: Utwórz Azure Bot

1. Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Wypełnij kartę **Basics**:

   | Pole               | Wartość                                                 |
   | ------------------ | ------------------------------------------------------- |
   | **Bot handle**     | Nazwa bota, np. `openclaw-msteams` (musi być unikalna)  |
   | **Subscription**   | Wybierz subskrypcję Azure                               |
   | **Resource group** | Utwórz nową lub użyj istniejącej                        |
   | **Pricing tier**   | **Free** do developmentu/testów                         |
   | **Type of App**    | **Single Tenant** (zalecane — zobacz uwagę poniżej)     |
   | **Creation type**  | **Create new Microsoft App ID**                         |

<Warning>
Tworzenie nowych botów wielodzierżawowych zostało wycofane po 2025-07-31. Dla nowych botów użyj **Single Tenant**.
</Warning>

3. Kliknij **Review + create** → **Create** (poczekaj około 1-2 minuty)

### Krok 2: Pobierz poświadczenia

1. Przejdź do zasobu Azure Bot → **Configuration**
2. Skopiuj **Microsoft App ID** → to jest Twoje `appId`
3. Kliknij **Manage Password** → przejdź do rejestracji aplikacji
4. W sekcji **Certificates & secrets** → **New client secret** → skopiuj **Value** → to jest Twoje `appPassword`
5. Przejdź do **Overview** → skopiuj **Directory (tenant) ID** → to jest Twoje `tenantId`

### Krok 3: Skonfiguruj punkt końcowy wiadomości

1. W Azure Bot → **Configuration**
2. Ustaw **Messaging endpoint** na URL swojego Webhook:
   - Produkcja: `https://your-domain.com/api/messages`
   - Lokalny development: użyj tunelu (zobacz [Development lokalny](#local-development-tunneling) poniżej)

### Krok 4: Włącz kanał Teams

1. W Azure Bot → **Channels**
2. Kliknij **Microsoft Teams** → Configure → Save
3. Zaakceptuj Warunki świadczenia usług

### Krok 5: Zbuduj manifest aplikacji Teams

- Dołącz wpis `bot` z `botId = <App ID>`.
- Zakresy: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (wymagane do obsługi plików w zakresie osobistym).
- Dodaj uprawnienia RSC (zobacz [Uprawnienia RSC](#current-teams-rsc-permissions-manifest)).
- Utwórz ikony: `outline.png` (32x32) i `color.png` (192x192).
- Spakuj wszystkie trzy pliki razem: `manifest.json`, `outline.png`, `color.png`.

### Krok 6: Skonfiguruj OpenClaw

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Zmienne środowiskowe: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Krok 7: Uruchom Gateway

Kanał Teams uruchamia się automatycznie, gdy Plugin jest dostępny i istnieje konfiguracja `msteams` z poświadczeniami.

</details>

## Uwierzytelnianie federacyjne (certyfikat plus tożsamość zarządzana)

> Dodano w 2026.4.11

W przypadku wdrożeń produkcyjnych OpenClaw obsługuje **uwierzytelnianie federacyjne** jako bezpieczniejszą alternatywę dla sekretów klienta. Dostępne są dwie metody:

### Opcja A: Uwierzytelnianie oparte na certyfikacie

Użyj certyfikatu PEM zarejestrowanego w rejestracji aplikacji Entra ID.

**Konfiguracja:**

1. Wygeneruj lub uzyskaj certyfikat (format PEM z kluczem prywatnym).
2. W Entra ID → App Registration → **Certificates & secrets** → **Certificates** → prześlij certyfikat publiczny.

**Konfiguracja:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opcja B: Tożsamość zarządzana Azure

Użyj Azure Managed Identity do uwierzytelniania bez hasła. To idealne rozwiązanie dla wdrożeń w infrastrukturze Azure (AKS, App Service, maszyny wirtualne Azure), gdzie dostępna jest tożsamość zarządzana.

**Jak to działa:**

1. Pod bota/maszyna wirtualna ma tożsamość zarządzaną (przypisaną przez system lub przez użytkownika).
2. **Poświadczenie tożsamości federacyjnej** łączy tożsamość zarządzaną z rejestracją aplikacji Entra ID.
3. W czasie wykonywania OpenClaw używa `@azure/identity`, aby pozyskać tokeny z punktu końcowego Azure IMDS (`169.254.169.254`).
4. Token jest przekazywany do Teams SDK na potrzeby uwierzytelniania bota.

**Wymagania wstępne:**

- Infrastruktura Azure z włączoną tożsamością zarządzaną (tożsamość obciążenia AKS, App Service, VM)
- Poświadczenie tożsamości federacyjnej utworzone w rejestracji aplikacji Entra ID
- Dostęp sieciowy do IMDS (`169.254.169.254:80`) z poda/VM

**Konfiguracja (tożsamość zarządzana przypisana przez system):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Konfiguracja (tożsamość zarządzana przypisana przez użytkownika):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (tylko dla przypisanej przez użytkownika)

### Konfiguracja AKS Workload Identity

Dla wdrożeń AKS używających tożsamości obciążenia:

1. **Włącz tożsamość obciążenia** w klastrze AKS.
2. **Utwórz poświadczenie tożsamości federacyjnej** w rejestracji aplikacji Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Dodaj adnotację do konta usługi Kubernetes** z identyfikatorem klienta aplikacji:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Oznacz pod etykietą** na potrzeby wstrzykiwania tożsamości obciążenia:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zapewnij dostęp sieciowy** do IMDS (`169.254.169.254`) — jeśli używasz NetworkPolicy, dodaj regułę ruchu wychodzącego zezwalającą na ruch do `169.254.169.254/32` na porcie 80.

### Porównanie typów uwierzytelniania

| Metoda               | Konfiguracja                                  | Zalety                              | Wady                                         |
| -------------------- | ---------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| **Sekret klienta**   | `appPassword`                                  | Prosta konfiguracja                | Wymagana rotacja sekretów, mniejsze bezpieczeństwo |
| **Certyfikat**       | `authType: "federated"` + `certificatePath`    | Brak współdzielonego sekretu przesyłanego przez sieć | Narzut związany z zarządzaniem certyfikatami |
| **Tożsamość zarządzana** | `authType: "federated"` + `useManagedIdentity` | Bez hasła, bez sekretów do zarządzania | Wymagana infrastruktura Azure                |

**Domyślne zachowanie:** Gdy `authType` nie jest ustawiony, OpenClaw domyślnie używa uwierzytelniania za pomocą sekretu klienta. Istniejące konfiguracje nadal działają bez zmian.

## Programowanie lokalne (tunelowanie)

Teams nie może dotrzeć do `localhost`. Użyj trwałego tunelu deweloperskiego, aby adres URL pozostawał taki sam między sesjami:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternatywy: `ngrok http 3978` lub `tailscale funnel 3978` (adresy URL mogą zmieniać się w każdej sesji).

Jeśli adres URL tunelu się zmieni, zaktualizuj punkt końcowy:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Testowanie bota

**Uruchom diagnostykę:**

```bash
teams app doctor <teamsAppId>
```

Sprawdza rejestrację bota, aplikację AAD, manifest i konfigurację SSO w jednym przebiegu.

**Wyślij wiadomość testową:**

1. Zainstaluj aplikację Teams (użyj linku instalacyjnego z `teams app get <id> --install-link`)
2. Znajdź bota w Teams i wyślij wiadomość prywatną
3. Sprawdź logi Gateway pod kątem przychodzącej aktywności

## Zmienne środowiskowe

Wszystkie klucze konfiguracji można zamiast tego ustawić za pomocą zmiennych środowiskowych:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opcjonalnie: `"secret"` lub `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federacyjnie + certyfikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcjonalne, niewymagane do uwierzytelniania)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federacyjnie + tożsamość zarządzana)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (tylko MI przypisana przez użytkownika)

## Akcja informacji o członku

OpenClaw udostępnia akcję `member-info` opartą na Graph dla Microsoft Teams, aby agenci i automatyzacje mogli pobierać szczegóły członków kanału (nazwę wyświetlaną, adres e-mail, rolę) bezpośrednio z Microsoft Graph.

Wymagania:

- Uprawnienie RSC `Member.Read.Group` (już w zalecanym manifeście)
- Dla wyszukiwań między zespołami: uprawnienie aplikacyjne Graph `User.Read.All` ze zgodą administratora

Akcja jest kontrolowana przez `channels.msteams.actions.memberInfo` (domyślnie: włączona, gdy dostępne są poświadczenia Graph).

## Kontekst historii

- `channels.msteams.historyLimit` kontroluje, ile ostatnich wiadomości z kanału/grupy jest opakowywanych w prompt.
- Używa wartości zapasowej `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).
- Pobrana historia wątku jest filtrowana według list dozwolonych nadawców (`allowFrom` / `groupAllowFrom`), więc zasilanie kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Kontekst cytowanych załączników (`ReplyTo*` pochodzący z HTML odpowiedzi Teams) jest obecnie przekazywany w otrzymanej postaci.
- Innymi słowy, listy dozwolonych nadawców kontrolują, kto może uruchomić agenta; obecnie filtrowane są tylko konkretne ścieżki kontekstu uzupełniającego.
- Historię wiadomości prywatnych można ograniczyć za pomocą `channels.msteams.dmHistoryLimit` (tury użytkownika). Nadpisania dla poszczególnych użytkowników: `channels.msteams.dms["<user_id>"].historyLimit`.

## Bieżące uprawnienia Teams RSC (manifest)

To są **istniejące uprawnienia resourceSpecific** w naszym manifeście aplikacji Teams. Mają zastosowanie tylko w zespole/czacie, w którym aplikacja jest zainstalowana.

**Dla kanałów (zakres zespołu):**

- `ChannelMessage.Read.Group` (Application) - odbieranie wszystkich wiadomości z kanału bez @wzmianki
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Dla czatów grupowych:**

- `ChatMessage.Read.Chat` (Application) - odbieranie wszystkich wiadomości czatu grupowego bez @wzmianki

Aby dodać uprawnienia RSC za pomocą Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Przykładowy manifest Teams (zredagowany)

Minimalny, poprawny przykład z wymaganymi polami. Zastąp identyfikatory i adresy URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Zastrzeżenia dotyczące manifestu (pola wymagane)

- `bots[].botId` **musi** odpowiadać identyfikatorowi Azure Bot App ID.
- `webApplicationInfo.id` **musi** odpowiadać identyfikatorowi Azure Bot App ID.
- `bots[].scopes` musi obejmować powierzchnie, których planujesz używać (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` jest wymagane do obsługi plików w zakresie osobistym.
- `authorization.permissions.resourceSpecific` musi zawierać odczyt/wysyłanie kanału, jeśli chcesz obsługiwać ruch w kanałach.

### Aktualizowanie istniejącej aplikacji

Aby zaktualizować już zainstalowaną aplikację Teams (np. w celu dodania uprawnień RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Po aktualizacji ponownie zainstaluj aplikację w każdym zespole, aby nowe uprawnienia zaczęły obowiązywać, oraz **całkowicie zamknij i ponownie uruchom Teams** (nie tylko zamknij okno), aby wyczyścić zbuforowane metadane aplikacji.

<details>
<summary>Ręczna aktualizacja manifestu (bez CLI)</summary>

1. Zaktualizuj `manifest.json` o nowe ustawienia
2. **Zwiększ wartość pola `version`** (np. `1.0.0` → `1.1.0`)
3. **Ponownie spakuj do zipa** manifest z ikonami (`manifest.json`, `outline.png`, `color.png`)
4. Prześlij nowy plik zip:
   - **Centrum administracyjne Teams:** Aplikacje Teams → Zarządzaj aplikacjami → znajdź swoją aplikację → Prześlij nową wersję
   - **Sideload:** W Teams → Aplikacje → Zarządzaj aplikacjami → Prześlij aplikację niestandardową

</details>

## Możliwości: tylko RSC vs Graph

### Z użyciem **tylko Teams RSC** (aplikacja zainstalowana, brak uprawnień Graph API)

Działa:

- Odczytywanie treści **tekstowej** wiadomości kanału.
- Wysyłanie treści **tekstowej** wiadomości kanału.
- Odbieranie załączników plików w **wiadomościach prywatnych (DM)**.

Nie działa:

- **Obrazy lub zawartość plików** w kanałach/grupach (ładunek zawiera tylko stub HTML).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczytywanie historii wiadomości (poza zdarzeniem Webhook na żywo).

### Z użyciem **Teams RSC + uprawnienia aplikacyjne Microsoft Graph**

Dodaje:

- Pobieranie hostowanej zawartości (obrazów wklejonych do wiadomości).
- Pobieranie załączników plików przechowywanych w SharePoint/OneDrive.
- Odczytywanie historii wiadomości kanału/czatu przez Graph.

### RSC vs Graph API

| Możliwość              | Uprawnienia RSC      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Wiadomości w czasie rzeczywistym** | Tak (przez Webhook) | Nie (tylko odpytywanie)             |
| **Wiadomości historyczne** | Nie                | Tak (można odpytywać historię)      |
| **Złożoność konfiguracji** | Tylko manifest aplikacji | Wymaga zgody administratora + przepływu tokenów |
| **Działa offline**     | Nie (musi działać)   | Tak (odpytywanie w dowolnym momencie) |

**Najważniejsze:** RSC służy do nasłuchiwania w czasie rzeczywistym; Graph API służy do dostępu historycznego. Aby nadrobić wiadomości pominięte podczas trybu offline, potrzebujesz Graph API z `ChannelMessage.Read.All` (wymaga zgody administratora).

## Media i historia z obsługą Graph (wymagane dla kanałów)

Jeśli potrzebujesz obrazów/plików w **kanałach** albo chcesz pobierać **historię wiadomości**, musisz włączyć uprawnienia Microsoft Graph i udzielić zgody administratora.

1. W Entra ID (Azure AD) **Rejestracja aplikacji** dodaj **uprawnienia aplikacyjne** Microsoft Graph:
   - `ChannelMessage.Read.All` (załączniki kanałów + historia)
   - `Chat.Read.All` lub `ChatMessage.Read.All` (czaty grupowe)
2. **Udziel zgody administratora** dla dzierżawy.
3. Zwiększ **wersję manifestu** aplikacji Teams, prześlij ją ponownie i **ponownie zainstaluj aplikację w Teams**.
4. **Całkowicie zamknij i ponownie uruchom Teams**, aby wyczyścić zbuforowane metadane aplikacji.

**Dodatkowe uprawnienie dla wzmianek o użytkownikach:** @wzmianki o użytkownikach działają od razu dla użytkowników w konwersacji. Jeśli jednak chcesz dynamicznie wyszukiwać i oznaczać użytkowników, których **nie ma w bieżącej konwersacji**, dodaj uprawnienie `User.Read.All` (Application) i udziel zgody administratora.

## Znane ograniczenia

### Limity czasu Webhook

Teams dostarcza wiadomości przez HTTP Webhook. Jeśli przetwarzanie trwa zbyt długo (np. wolne odpowiedzi LLM), możesz zobaczyć:

- Limity czasu Gateway
- Ponowne próby dostarczenia wiadomości przez Teams (powodujące duplikaty)
- Porzucone odpowiedzi

OpenClaw obsługuje to przez szybkie zwracanie odpowiedzi i proaktywne wysyłanie odpowiedzi, ale bardzo wolne odpowiedzi nadal mogą powodować problemy.

### Formatowanie

Markdown w Teams jest bardziej ograniczony niż w Slack lub Discord:

- Podstawowe formatowanie działa: **pogrubienie**, _kursywa_, `code`, linki
- Złożony markdown (tabele, listy zagnieżdżone) może nie renderować się poprawnie
- Adaptive Cards są obsługiwane dla ankiet i semantycznych wysyłek prezentacyjnych (zobacz poniżej)

## Konfiguracja

Kluczowe ustawienia (zobacz `/gateway/configuration`, aby poznać współdzielone wzorce kanałów):

- `channels.msteams.enabled`: włącz/wyłącz kanał.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: dane uwierzytelniające bota.
- `channels.msteams.webhook.port` (domyślnie `3978`)
- `channels.msteams.webhook.path` (domyślnie `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing)
- `channels.msteams.allowFrom`: lista dozwolonych DM (zalecane identyfikatory obiektów AAD). Kreator rozwiązuje nazwy na identyfikatory podczas konfiguracji, gdy dostęp do Graph jest dostępny.
- `channels.msteams.dangerouslyAllowNameMatching`: przełącznik awaryjny ponownie włączający dopasowywanie według zmiennego UPN/nazwy wyświetlanej oraz bezpośrednie routowanie nazw zespołów/kanałów.
- `channels.msteams.textChunkLimit`: rozmiar wychodzącego fragmentu tekstu.
- `channels.msteams.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić według pustych wierszy (granic akapitów) przed dzieleniem według długości.
- `channels.msteams.mediaAllowHosts`: lista dozwolonych hostów załączników przychodzących (domyślnie domeny Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista dozwolonych hostów do dołączania nagłówków Authorization przy ponownych próbach mediów (domyślnie hosty Graph + Bot Framework).
- `channels.msteams.requireMention`: wymagaj @wzmianki w kanałach/grupach (domyślnie true).
- `channels.msteams.replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: nadpisanie dla zespołu.
- `channels.msteams.teams.<teamId>.requireMention`: nadpisanie dla zespołu.
- `channels.msteams.teams.<teamId>.tools`: domyślne nadpisania zasad narzędzi dla zespołu (`allow`/`deny`/`alsoAllow`) używane, gdy brakuje nadpisania kanału.
- `channels.msteams.teams.<teamId>.toolsBySender`: domyślne nadpisania zasad narzędzi dla zespołu i nadawcy (obsługiwany symbol wieloznaczny `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: nadpisanie dla kanału.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: nadpisanie dla kanału.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: nadpisania zasad narzędzi dla kanału (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: nadpisania zasad narzędzi dla kanału i nadawcy (obsługiwany symbol wieloznaczny `"*"`).
- Klucze `toolsBySender` powinny używać jawnych prefiksów:
  `id:`, `e164:`, `username:`, `name:` (starsze klucze bez prefiksu nadal mapują tylko na `id:`).
- `channels.msteams.actions.memberInfo`: włącz lub wyłącz akcję informacji o członku opartą na Graph (domyślnie: włączona, gdy dane uwierzytelniające Graph są dostępne).
- `channels.msteams.authType`: typ uwierzytelniania — `"secret"` (domyślnie) lub `"federated"`.
- `channels.msteams.certificatePath`: ścieżka do pliku certyfikatu PEM (federacyjne + certyfikatowe uwierzytelnianie).
- `channels.msteams.certificateThumbprint`: odcisk palca certyfikatu (opcjonalny, niewymagany do uwierzytelniania).
- `channels.msteams.useManagedIdentity`: włącz uwierzytelnianie przy użyciu tożsamości zarządzanej (tryb federacyjny).
- `channels.msteams.managedIdentityClientId`: identyfikator klienta tożsamości zarządzanej przypisanej przez użytkownika.
- `channels.msteams.sharePointSiteId`: identyfikator witryny SharePoint do przesyłania plików w czatach grupowych/kanałach (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)).

## Routowanie i sesje

- Klucze sesji są zgodne ze standardowym formatem agenta (zobacz [/concepts/session](/pl/concepts/session)):
  - Wiadomości bezpośrednie współdzielą sesję główną (`agent:<agentId>:<mainKey>`).
  - Wiadomości kanału/grupy używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki kontra wpisy

Teams niedawno wprowadził dwa style interfejsu kanału oparte na tym samym bazowym modelu danych:

| Styl                     | Opis                                                        | Zalecane `replyStyle` |
| ------------------------ | ----------------------------------------------------------- | --------------------- |
| **Wpisy** (klasyczne)    | Wiadomości pojawiają się jako karty z odpowiedziami w wątku pod spodem | `thread` (domyślnie)  |
| **Wątki** (jak Slack)    | Wiadomości płyną liniowo, bardziej jak w Slack              | `top-level`           |

**Problem:** API Teams nie ujawnia, którego stylu interfejsu używa kanał. Jeśli użyjesz niewłaściwego `replyStyle`:

- `thread` w kanale w stylu wątków → odpowiedzi pojawiają się niezręcznie zagnieżdżone
- `top-level` w kanale w stylu wpisów → odpowiedzi pojawiają się jako osobne wpisy najwyższego poziomu zamiast w wątku

**Rozwiązanie:** Skonfiguruj `replyStyle` dla kanału na podstawie sposobu skonfigurowania kanału:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Załączniki i obrazy

**Obecne ograniczenia:**

- **DM:** Obrazy i załączniki plików działają przez API plików bota Teams.
- **Kanały/grupy:** Załączniki znajdują się w magazynie M365 (SharePoint/OneDrive). Ładunek Webhook zawiera tylko zalążek HTML, a nie rzeczywiste bajty pliku. **Uprawnienia Graph API są wymagane** do pobierania załączników kanału.
- Przy jawnych wysyłkach, w których plik jest najważniejszy, użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalne `message` staje się towarzyszącym tekstem/komentarzem, a `filename` nadpisuje przesłaną nazwę.

Bez uprawnień Graph wiadomości kanału z obrazami będą odbierane tylko jako tekst (treść obrazu nie jest dostępna dla bota).
Domyślnie OpenClaw pobiera media tylko z nazw hostów Microsoft/Teams. Nadpisz to za pomocą `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane tylko dla hostów w `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph + Bot Framework). Utrzymuj tę listę restrykcyjną (unikaj sufiksów wielodzierżawczych).

## Wysyłanie plików w czatach grupowych

Boty mogą wysyłać pliki w DM przy użyciu przepływu FileConsentCard (wbudowanego). Jednak **wysyłanie plików w czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Kontekst                 | Jak wysyłane są pliki                       | Wymagana konfiguracja                            |
| ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → użytkownik akceptuje → bot przesyła | Działa od razu                                   |
| **Czaty grupowe/kanały** | Przesłanie do SharePoint → udostępnienie linku | Wymaga `sharePointSiteId` + uprawnień Graph      |
| **Obrazy (dowolny kontekst)** | Inline zakodowane w Base64                 | Działa od razu                                   |

### Dlaczego czaty grupowe wymagają SharePoint

Boty nie mają osobistego dysku OneDrive (endpoint Graph API `/me/drive` nie działa dla tożsamości aplikacji). Aby wysyłać pliki w czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link udostępniania.

### Konfiguracja

1. **Dodaj uprawnienia Graph API** w Entra ID (Azure AD) → Rejestracja aplikacji:
   - `Sites.ReadWrite.All` (Application) - przesyłanie plików do SharePoint
   - `Chat.Read.All` (Application) - opcjonalne, włącza linki udostępniania dla użytkowników

2. **Udziel zgody administratora** dla dzierżawy.

3. **Uzyskaj identyfikator witryny SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Skonfiguruj OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Zachowanie udostępniania

| Uprawnienie                            | Zachowanie udostępniania                                |
| -------------------------------------- | ------------------------------------------------------- |
| Tylko `Sites.ReadWrite.All`            | Link udostępniania dla całej organizacji (każda osoba w organizacji może uzyskać dostęp) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link udostępniania dla użytkowników (dostęp mają tylko członkowie czatu) |

Udostępnianie dla użytkowników jest bezpieczniejsze, ponieważ tylko uczestnicy czatu mogą uzyskać dostęp do pliku. Jeśli brakuje uprawnienia `Chat.Read.All`, bot wraca do udostępniania w całej organizacji.

### Zachowanie awaryjne

| Scenariusz                                      | Wynik                                              |
| ----------------------------------------------- | -------------------------------------------------- |
| Czat grupowy + plik + skonfigurowany `sharePointSiteId` | Przesłanie do SharePoint, wysłanie linku udostępniania |
| Czat grupowy + plik + brak `sharePointSiteId`   | Próba przesłania do OneDrive (może się nie udać), wysłanie tylko tekstu |
| Czat osobisty + plik                            | Przepływ FileConsentCard (działa bez SharePoint)   |
| Dowolny kontekst + obraz                        | Inline zakodowane w Base64 (działa bez SharePoint) |

### Lokalizacja przechowywania plików

Przesłane pliki są przechowywane w folderze `/OpenClawShared/` w domyślnej bibliotece dokumentów skonfigurowanej witryny SharePoint.

## Ankiety (Adaptive Cards)

OpenClaw wysyła ankiety Teams jako Adaptive Cards (nie ma natywnego API ankiet Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Głosy są zapisywane przez Gateway w `~/.openclaw/msteams-polls.json`.
- Gateway musi pozostać online, aby zapisywać głosy.
- Ankiety nie publikują jeszcze automatycznie podsumowań wyników (w razie potrzeby sprawdź plik magazynu).

## Karty prezentacyjne

Wysyłaj semantyczne ładunki prezentacyjne do użytkowników lub konwersacji Teams przy użyciu narzędzia `message` albo CLI. OpenClaw renderuje je jako Teams Adaptive Cards z ogólnego kontraktu prezentacji.

Parametr `presentation` przyjmuje bloki semantyczne. Gdy podano `presentation`, tekst wiadomości jest opcjonalny.

**Narzędzie agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Szczegóły formatu celu znajdziesz poniżej w sekcji [Formaty celów](#target-formats).

## Formaty celów

Cele MSTeams używają prefiksów, aby odróżnić użytkowników od konwersacji:

| Typ celu            | Format                           | Przykład                                            |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Użytkownik (według identyfikatora) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Użytkownik (według nazwy) | `user:<display-name>`            | `user:John Smith` (wymaga Graph API)                |
| Grupa/kanał         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupa/kanał (surowy) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jeśli zawiera `@thread`) |

**Przykłady CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Przykłady narzędzi agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
Bez prefiksu `user:` nazwy domyślnie są rozpoznawane jako grupy lub zespoły. Zawsze używaj `user:`, gdy wskazujesz osoby według nazwy wyświetlanej.
</Note>

## Wiadomości proaktywne

- Wiadomości proaktywne są możliwe tylko **po** interakcji użytkownika, ponieważ w tym momencie przechowujemy odwołania do konwersacji.
- Zobacz `/gateway/configuration` dla `dmPolicy` i bramkowania listą dozwolonych.

## Identyfikatory zespołów i kanałów (częsta pułapka)

Parametr zapytania `groupId` w adresach URL Teams **NIE** jest identyfikatorem zespołu używanym w konfiguracji. Zamiast tego wyodrębnij identyfikatory ze ścieżki URL:

**Adres URL zespołu:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**Adres URL kanału:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Dla konfiguracji:**

- Klucz zespołu = segment ścieżki po `/team/` (po dekodowaniu URL, np. `19:Bk4j...@thread.tacv2`; starsze dzierżawy mogą pokazywać `@thread.skype`, co również jest poprawne)
- Klucz kanału = segment ścieżki po `/channel/` (po dekodowaniu URL)
- **Ignoruj** parametr zapytania `groupId` na potrzeby routingu OpenClaw. Jest to identyfikator grupy Microsoft Entra, a nie identyfikator konwersacji Bot Framework używany w przychodzących aktywnościach Teams.

## Kanały prywatne

Boty mają ograniczoną obsługę w kanałach prywatnych:

| Funkcja                      | Kanały standardowe | Kanały prywatne                |
| ---------------------------- | ------------------ | ------------------------------ |
| Instalacja bota              | Tak                | Ograniczona                    |
| Wiadomości w czasie rzeczywistym (Webhook) | Tak | Może nie działać               |
| Uprawnienia RSC              | Tak                | Mogą działać inaczej           |
| @wzmianki                    | Tak                | Jeśli bot jest dostępny        |
| Historia Graph API           | Tak                | Tak (z uprawnieniami)          |

**Obejścia, jeśli kanały prywatne nie działają:**

1. Użyj kanałów standardowych do interakcji z botem
2. Użyj wiadomości prywatnych - użytkownicy zawsze mogą pisać bezpośrednio do bota
3. Użyj Graph API do dostępu do historii (wymaga `ChannelMessage.Read.All`)

## Rozwiązywanie problemów

### Częste problemy

- **Obrazy nie wyświetlają się w kanałach:** Brakuje uprawnień Graph lub zgody administratora. Zainstaluj ponownie aplikację Teams i całkowicie zamknij oraz otwórz ponownie Teams.
- **Brak odpowiedzi w kanale:** wzmianki są domyślnie wymagane; ustaw `channels.msteams.requireMention=false` albo skonfiguruj to dla zespołu/kanału.
- **Niezgodność wersji (Teams nadal pokazuje stary manifest):** usuń i dodaj aplikację ponownie, a następnie całkowicie zamknij Teams, aby odświeżyć.
- **401 Unauthorized z Webhook:** Oczekiwane podczas testowania ręcznego bez Azure JWT - oznacza, że punkt końcowy jest osiągalny, ale uwierzytelnianie nie powiodło się. Użyj Azure Web Chat, aby przetestować poprawnie.

### Błędy przesyłania manifestu

- **„Icon file cannot be empty”:** Manifest odwołuje się do plików ikon, które mają 0 bajtów. Utwórz poprawne ikony PNG (32x32 dla `outline.png`, 192x192 dla `color.png`).
- **„webApplicationInfo.Id already in use”:** Aplikacja nadal jest zainstalowana w innym zespole/czacie. Najpierw ją znajdź i odinstaluj albo poczekaj 5-10 minut na propagację.
- **„Something went wrong” podczas przesyłania:** Zamiast tego prześlij przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otwórz narzędzia deweloperskie przeglądarki (F12) → kartę Sieć i sprawdź treść odpowiedzi, aby zobaczyć rzeczywisty błąd.
- **Niepowodzenie sideloadingu:** Spróbuj użyć opcji „Upload an app to your org's app catalog” zamiast „Upload a custom app” - często omija to ograniczenia sideloadingu.

### Uprawnienia RSC nie działają

1. Sprawdź, czy `webApplicationInfo.id` dokładnie odpowiada App ID twojego bota
2. Prześlij aplikację ponownie i zainstaluj ją ponownie w zespole/czacie
3. Sprawdź, czy administrator twojej organizacji zablokował uprawnienia RSC
4. Potwierdź, że używasz właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych

## Odnośniki

- [Utwórz Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tworzenie aplikacji Teams i zarządzanie nimi
- [Schemat manifestu aplikacji Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Odbieranie wiadomości kanału z RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Dokumentacja uprawnień RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Obsługa plików przez bota Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanał/grupa wymaga Graph)
- [Wiadomości proaktywne](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI do zarządzania botami

## Powiązane

- [Omówienie kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
