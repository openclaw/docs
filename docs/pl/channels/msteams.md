---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Stan obsługi bota Microsoft Teams, możliwości i konfiguracja
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-10T19:22:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: f41c148e7ea0c2d0bde257d7af3ba0dc990f20110c08df3bb8c4d3f84e8563e0
    source_path: channels/msteams.md
    workflow: 16
---

Status: tekst i załączniki DM są obsługiwane; wysyłanie plików w kanałach/grupach wymaga `sharePointSiteId` i uprawnień Graph (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane za pomocą Adaptive Cards. Akcje wiadomości udostępniają jawne `upload-file` dla wysyłek z plikiem jako pierwszym elementem.

## Dołączony Plugin

Microsoft Teams jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc w zwykłej spakowanej kompilacji nie jest wymagana osobna instalacja.

Jeśli używasz starszej kompilacji albo niestandardowej instalacji, która wyklucza dołączony Teams, zainstaluj pakiet npm bezpośrednio:

```bash
openclaw plugins install @openclaw/msteams
```

Użyj samego pakietu, aby śledzić bieżący oficjalny tag wydania. Przypnij dokładną wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

Lokalne checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) obsługuje rejestrację bota, tworzenie manifestu i generowanie poświadczeń jednym poleceniem.

**1. Zainstaluj i zaloguj się**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI jest obecnie w wersji zapoznawczej. Polecenia i flagi mogą zmieniać się między wydaniami.
</Note>

**2. Uruchom tunel** (Teams nie może uzyskać dostępu do localhost)

Zainstaluj i uwierzytelnij devtunnel CLI, jeśli jeszcze tego nie zrobiono ([przewodnik wprowadzający](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` jest wymagane, ponieważ Teams nie może uwierzytelniać się w devtunnels. Każde przychodzące żądanie bota jest nadal automatycznie weryfikowane przez Teams SDK.
</Note>

Alternatywy: `ngrok http 3978` albo `tailscale funnel 3978` (ale mogą one zmieniać adresy URL w każdej sesji).

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
- Rejestruje bota (domyślnie zarządzanego przez Teams - subskrypcja Azure nie jest potrzebna)

Dane wyjściowe pokażą `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` oraz **Teams App ID** - zanotuj je do kolejnych kroków. Polecenie oferuje także bezpośrednią instalację aplikacji w Teams.

**4. Skonfiguruj OpenClaw** przy użyciu poświadczeń z danych wyjściowych:

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

Albo użyj bezpośrednio zmiennych środowiskowych: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Zainstaluj aplikację w Teams**

`teams app create` poprosi o zainstalowanie aplikacji - wybierz „Install in Teams”. Jeśli ten krok został pominięty, link można uzyskać później:

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
Czaty grupowe są domyślnie blokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi grupowe, ustaw `channels.msteams.groupAllowFrom` albo użyj `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (z bramkowaniem przez wzmiankę).
</Note>

## Cele

- Rozmawiaj z OpenClaw przez DM Teams, czaty grupowe albo kanały.
- Utrzymuj deterministyczne routowanie: odpowiedzi zawsze wracają do kanału, z którego przyszły.
- Domyślnie używaj bezpiecznego zachowania kanału (wymagane wzmianki, chyba że skonfigurowano inaczej).

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
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD albo statycznych grup dostępu nadawców, takich jak `accessGroup:core-team`.
- Nie polegaj na dopasowywaniu UPN/nazwy wyświetlanej dla list dozwolonych - mogą się zmieniać. OpenClaw domyślnie wyłącza bezpośrednie dopasowywanie nazw; włącz je jawnie za pomocą `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozwiązywać nazwy na identyfikatory za pomocą Microsoft Graph, gdy pozwalają na to poświadczenia.

**Dostęp grupowy**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (blokowane, chyba że dodasz `groupAllowFrom`). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- `channels.msteams.groupAllowFrom` kontroluje, którzy nadawcy albo statyczne grupy dostępu nadawców mogą wyzwalać działanie w czatach grupowych/kanałach (z rezerwowym użyciem `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (domyślnie nadal z bramkowaniem przez wzmiankę).
- Aby nie zezwalać na **żadne kanały**, ustaw `channels.msteams.groupPolicy: "disabled"`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + lista dozwolonych kanałów**

- Ogranicz odpowiedzi grup/kanałów, wymieniając zespoły i kanały w `channels.msteams.teams`.
- Klucze powinny używać stabilnych identyfikatorów konwersacji Teams z linków Teams, a nie zmiennych nazw wyświetlanych.
- Gdy `groupPolicy="allowlist"` i istnieje lista dozwolonych zespołów, akceptowane są tylko wymienione zespoły/kanały (z bramkowaniem przez wzmiankę).
- Kreator konfiguracji akceptuje wpisy `Team/Channel` i zapisuje je za Ciebie.
- Podczas uruchamiania OpenClaw rozwiązuje nazwy zespołów/kanałów oraz list dozwolonych użytkowników na identyfikatory (gdy pozwalają na to uprawnienia Graph)
  i loguje mapowanie; nierozwiązane nazwy zespołów/kanałów są zachowywane w takiej postaci, w jakiej je wpisano, ale domyślnie ignorowane przy routowaniu, chyba że włączono `channels.msteams.dangerouslyAllowNameMatching: true`.

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

Jeśli nie możesz użyć Teams CLI, możesz skonfigurować bota ręcznie przez Azure Portal.

### Jak to działa

1. Upewnij się, że Plugin Microsoft Teams jest dostępny (dołączony w bieżących wydaniach).
2. Utwórz **Azure Bot** (App ID + sekret + tenant ID).
3. Zbuduj **pakiet aplikacji Teams**, który odwołuje się do bota i zawiera poniższe uprawnienia RSC.
4. Prześlij/zainstaluj aplikację Teams w zespole (albo w zakresie osobistym dla DM).
5. Skonfiguruj `msteams` w `~/.openclaw/openclaw.json` (albo zmiennych środowiskowych) i uruchom Gateway.
6. Gateway domyślnie nasłuchuje ruchu Webhook Bot Framework pod `/api/messages`.

### Krok 1: Utwórz Azure Bot

1. Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Wypełnij kartę **Basics**:

   | Pole               | Wartość                                                  |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nazwa Twojego bota, np. `openclaw-msteams` (musi być unikalna) |
   | **Subscription**   | Wybierz swoją subskrypcję Azure                          |
   | **Resource group** | Utwórz nową albo użyj istniejącej                        |
   | **Pricing tier**   | **Free** do programowania/testowania                     |
   | **Type of App**    | **Single Tenant** (zalecane - zobacz uwagę poniżej)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Tworzenie nowych botów wielodostępnych zostało wycofane po 2025-07-31. Dla nowych botów używaj **Single Tenant**.
</Warning>

3. Kliknij **Review + create** → **Create** (poczekaj około 1-2 minuty)

### Krok 2: Pobierz poświadczenia

1. Przejdź do swojego zasobu Azure Bot → **Configuration**
2. Skopiuj **Microsoft App ID** → to jest Twoje `appId`
3. Kliknij **Manage Password** → przejdź do App Registration
4. W sekcji **Certificates & secrets** → **New client secret** → skopiuj **Value** → to jest Twoje `appPassword`
5. Przejdź do **Overview** → skopiuj **Directory (tenant) ID** → to jest Twoje `tenantId`

### Krok 3: Skonfiguruj punkt końcowy wiadomości

1. W Azure Bot → **Configuration**
2. Ustaw **Messaging endpoint** na swój URL Webhook:
   - Produkcja: `https://your-domain.com/api/messages`
   - Lokalne programowanie: użyj tunelu (zobacz poniżej [Programowanie lokalne](#local-development-tunneling))

### Krok 4: Włącz kanał Teams

1. W Azure Bot → **Channels**
2. Kliknij **Microsoft Teams** → Configure → Save
3. Zaakceptuj warunki korzystania z usługi

### Krok 5: Zbuduj manifest aplikacji Teams

- Uwzględnij wpis `bot` z `botId = <App ID>`.
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

1. Wygeneruj albo uzyskaj certyfikat (format PEM z kluczem prywatnym).
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

### Opcja B: Azure Managed Identity

Użyj Azure Managed Identity do uwierzytelniania bez hasła. To idealne rozwiązanie dla wdrożeń w infrastrukturze Azure (AKS, App Service, Azure VMs), gdzie dostępna jest tożsamość zarządzana.

**Jak to działa:**

1. Pod/VM bota ma tożsamość zarządzaną (przypisaną przez system albo przypisaną przez użytkownika).
2. **Poświadczenie tożsamości federacyjnej** łączy tożsamość zarządzaną z rejestracją aplikacji Entra ID.
3. W czasie działania OpenClaw używa `@azure/identity`, aby uzyskać tokeny z punktu końcowego Azure IMDS (`169.254.169.254`).
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

1. **Włącz tożsamość obciążenia** w swoim klastrze AKS.
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

4. **Oznacz poda etykietą** na potrzeby wstrzykiwania tożsamości obciążenia:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zapewnij dostęp sieciowy** do IMDS (`169.254.169.254`) - jeśli używasz NetworkPolicy, dodaj regułę ruchu wychodzącego zezwalającą na ruch do `169.254.169.254/32` na porcie 80.

### Porównanie typów uwierzytelniania

| Metoda                  | Konfiguracja                                  | Zalety                               | Wady                                        |
| ----------------------- | --------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| **Sekret klienta**      | `appPassword`                                 | Prosta konfiguracja                  | Wymagana rotacja sekretu, mniejsze bezpieczeństwo |
| **Certyfikat**          | `authType: "federated"` + `certificatePath`   | Brak współdzielonego sekretu w sieci | Narzut związany z zarządzaniem certyfikatami |
| **Tożsamość zarządzana** | `authType: "federated"` + `useManagedIdentity` | Bez haseł, brak sekretów do zarządzania | Wymagana infrastruktura Azure               |

**Domyślne zachowanie:** Gdy `authType` nie jest ustawione, OpenClaw domyślnie używa uwierzytelniania sekretem klienta. Istniejące konfiguracje nadal działają bez zmian.

## Programowanie lokalne (tunelowanie)

Teams nie może połączyć się z `localhost`. Użyj trwałego tunelu deweloperskiego, aby adres URL pozostawał taki sam między sesjami:

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
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcjonalnie, niewymagane do uwierzytelniania)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federacyjnie + tożsamość zarządzana)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (tylko MI przypisana przez użytkownika)

## Akcja informacji o członku

OpenClaw udostępnia opartą na Graph akcję `member-info` dla Microsoft Teams, aby agenci i automatyzacje mogli rozpoznawać szczegóły członków kanału (nazwa wyświetlana, e-mail, rola) bezpośrednio z Microsoft Graph.

Wymagania:

- Uprawnienie RSC `Member.Read.Group` (już w zalecanym manifeście)
- Dla wyszukiwań między zespołami: uprawnienie aplikacji Graph `User.Read.All` ze zgodą administratora

Akcja jest kontrolowana przez `channels.msteams.actions.memberInfo` (domyślnie: włączona, gdy dostępne są poświadczenia Graph).

## Kontekst historii

- `channels.msteams.historyLimit` kontroluje, ile ostatnich wiadomości kanału/grupy jest opakowywanych w prompt.
- Wraca do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).
- Pobrana historia wątku jest filtrowana według list dozwolonych nadawców (`allowFrom` / `groupAllowFrom`), więc wstępne zasilanie kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Kontekst cytowanego załącznika (`ReplyTo*` pochodzący z HTML odpowiedzi Teams) jest obecnie przekazywany w otrzymanej postaci.
- Innymi słowy, listy dozwolonych nadawców kontrolują, kto może uruchomić agenta; obecnie filtrowane są tylko określone ścieżki kontekstu uzupełniającego.
- Historię wiadomości prywatnych można ograniczyć za pomocą `channels.msteams.dmHistoryLimit` (tury użytkownika). Nadpisania dla poszczególnych użytkowników: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktualne uprawnienia RSC Teams (manifest)

To są **istniejące uprawnienia resourceSpecific** w naszym manifeście aplikacji Teams. Mają zastosowanie tylko w zespole/czacie, w którym aplikacja jest zainstalowana.

**Dla kanałów (zakres zespołu):**

- `ChannelMessage.Read.Group` (Application) - odbieranie wszystkich wiadomości kanału bez @wzmianki
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

- `bots[].botId` **musi** pasować do identyfikatora aplikacji Azure Bot.
- `webApplicationInfo.id` **musi** pasować do identyfikatora aplikacji Azure Bot.
- `bots[].scopes` musi obejmować powierzchnie, których planujesz używać (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` jest wymagane do obsługi plików w zakresie osobistym.
- `authorization.permissions.resourceSpecific` musi obejmować odczyt/wysyłanie kanału, jeśli chcesz obsługiwać ruch kanału.

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

1. Zaktualizuj swój `manifest.json` nowymi ustawieniami
2. **Zwiększ pole `version`** (np. `1.0.0` → `1.1.0`)
3. **Ponownie spakuj do zip** manifest z ikonami (`manifest.json`, `outline.png`, `color.png`)
4. Prześlij nowy plik zip:
   - **Teams Admin Center:** aplikacje Teams → Zarządzaj aplikacjami → znajdź swoją aplikację → Prześlij nową wersję
   - **Ładowanie boczne:** w Teams → Aplikacje → Zarządzaj swoimi aplikacjami → Prześlij aplikację niestandardową

</details>

## Możliwości: tylko RSC kontra Graph

### Z **samym Teams RSC** (aplikacja zainstalowana, bez uprawnień Graph API)

Działa:

- Odczyt **tekstowej** treści wiadomości kanału.
- Wysyłanie **tekstowej** treści wiadomości kanału.
- Odbieranie załączników plikowych w **osobistych wiadomościach prywatnych (DM)**.

Nie działa:

- **Zawartość obrazów lub plików** w kanałach/grupach (ładunek zawiera tylko stub HTML).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczytywanie historii wiadomości (poza zdarzeniem Webhook na żywo).

### Z **Teams RSC + uprawnieniami aplikacji Microsoft Graph**

Dodaje:

- Pobieranie hostowanej zawartości (obrazy wklejone do wiadomości).
- Pobieranie załączników plikowych przechowywanych w SharePoint/OneDrive.
- Odczytywanie historii wiadomości kanału/czatu przez Graph.

### RSC kontra Graph API

| Możliwość                 | Uprawnienia RSC       | Graph API                            |
| ------------------------- | --------------------- | ------------------------------------ |
| **Wiadomości w czasie rzeczywistym** | Tak (przez Webhook) | Nie (tylko odpytywanie)              |
| **Wiadomości historyczne** | Nie                   | Tak (można odpytywać historię)       |
| **Złożoność konfiguracji** | Tylko manifest aplikacji | Wymaga zgody administratora + przepływu tokenu |
| **Działa offline**        | Nie (musi działać)    | Tak (odpytywanie w dowolnym momencie) |

**Najważniejsze:** RSC służy do nasłuchiwania w czasie rzeczywistym; Graph API służy do dostępu historycznego. Aby nadrobić pominięte wiadomości podczas pracy offline, potrzebujesz Graph API z `ChannelMessage.Read.All` (wymaga zgody administratora).

## Multimedia + historia z obsługą Graph (wymagane dla kanałów)

Jeśli potrzebujesz obrazów/plików w **kanałach** lub chcesz pobierać **historię wiadomości**, musisz włączyć uprawnienia Microsoft Graph i przyznać zgodę administratora.

1. W **rejestracji aplikacji** Entra ID (Azure AD) dodaj **uprawnienia aplikacji** Microsoft Graph:
   - `ChannelMessage.Read.All` (załączniki kanału + historia)
   - `Chat.Read.All` lub `ChatMessage.Read.All` (czaty grupowe)
2. **Przyznaj zgodę administratora** dla dzierżawy.
3. Podbij **wersję manifestu** aplikacji Teams, prześlij ponownie i **ponownie zainstaluj aplikację w Teams**.
4. **Całkowicie zamknij i ponownie uruchom Teams**, aby wyczyścić zbuforowane metadane aplikacji.

**Dodatkowe uprawnienie dla wzmianek o użytkownikach:** @wzmianki o użytkownikach działają od razu dla użytkowników w konwersacji. Jeśli jednak chcesz dynamicznie wyszukiwać i wzmiankować użytkowników, którzy **nie są w bieżącej konwersacji**, dodaj uprawnienie `User.Read.All` (Application) i przyznaj zgodę administratora.

## Znane ograniczenia

### Limity czasu Webhook

Teams dostarcza wiadomości przez HTTP Webhook. Jeśli przetwarzanie trwa zbyt długo (np. wolne odpowiedzi LLM), możesz zobaczyć:

- Limity czasu Gateway
- Ponowne próby wiadomości przez Teams (powodujące duplikaty)
- Porzucone odpowiedzi

OpenClaw obsługuje to, szybko zwracając odpowiedź i wysyłając odpowiedzi proaktywnie, ale bardzo wolne odpowiedzi nadal mogą powodować problemy.

### Formatowanie

Markdown w Teams jest bardziej ograniczony niż w Slack lub Discord:

- Podstawowe formatowanie działa: **pogrubienie**, _kursywa_, `code`, linki
- Złożony markdown (tabele, listy zagnieżdżone) może nie renderować się poprawnie
- Adaptive Cards są obsługiwane dla ankiet i semantycznych wysyłek prezentacyjnych (zobacz niżej)

## Konfiguracja

Kluczowe ustawienia (zobacz `/gateway/configuration`, aby poznać współdzielone wzorce kanałów):

- `channels.msteams.enabled`: włącz/wyłącz kanał.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: poświadczenia bota.
- `channels.msteams.webhook.port` (domyślnie `3978`)
- `channels.msteams.webhook.path` (domyślnie `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing)
- `channels.msteams.allowFrom`: lista dozwolonych DM (zalecane identyfikatory obiektów AAD). Kreator rozwiązuje nazwy do identyfikatorów podczas konfiguracji, gdy dostęp do Graph jest dostępny.
- `channels.msteams.dangerouslyAllowNameMatching`: przełącznik awaryjny do ponownego włączenia zmiennego dopasowywania UPN/nazwy wyświetlanej oraz bezpośredniego routingu według nazw zespołów/kanałów.
- `channels.msteams.textChunkLimit`: rozmiar fragmentu tekstu wychodzącego.
- `channels.msteams.chunkMode`: `length` (domyślnie) albo `newline`, aby dzielić według pustych wierszy (granic akapitów) przed dzieleniem według długości.
- `channels.msteams.mediaAllowHosts`: lista dozwolonych hostów załączników przychodzących (domyślnie domeny Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista dozwolonych hostów do dołączania nagłówków Authorization przy ponownych próbach pobierania multimediów (domyślnie hosty Graph + Bot Framework).
- `channels.msteams.requireMention`: wymagaj @wzmianki w kanałach/grupach (domyślnie true).
- `channels.msteams.replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: nadpisanie dla zespołu.
- `channels.msteams.teams.<teamId>.requireMention`: nadpisanie dla zespołu.
- `channels.msteams.teams.<teamId>.tools`: domyślne nadpisania zasad narzędzi dla zespołu (`allow`/`deny`/`alsoAllow`) używane, gdy brakuje nadpisania kanału.
- `channels.msteams.teams.<teamId>.toolsBySender`: domyślne nadpisania zasad narzędzi dla zespołu według nadawcy (obsługiwany symbol wieloznaczny `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: nadpisanie dla kanału.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: nadpisanie dla kanału.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: nadpisania zasad narzędzi dla kanału (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: nadpisania zasad narzędzi dla kanału według nadawcy (obsługiwany symbol wieloznaczny `"*"`).
- Klucze `toolsBySender` powinny używać jawnych prefiksów:
  `id:`, `e164:`, `username:`, `name:` (starsze klucze bez prefiksu nadal mapują tylko do `id:`).
- `channels.msteams.actions.memberInfo`: włącz lub wyłącz akcję informacji o członku opartą na Graph (domyślnie: włączona, gdy poświadczenia Graph są dostępne).
- `channels.msteams.authType`: typ uwierzytelniania - `"secret"` (domyślnie) albo `"federated"`.
- `channels.msteams.certificatePath`: ścieżka do pliku certyfikatu PEM (uwierzytelnianie federacyjne + certyfikat).
- `channels.msteams.certificateThumbprint`: odcisk palca certyfikatu (opcjonalny, niewymagany do uwierzytelniania).
- `channels.msteams.useManagedIdentity`: włącz uwierzytelnianie tożsamością zarządzaną (tryb federacyjny).
- `channels.msteams.managedIdentityClientId`: identyfikator klienta dla tożsamości zarządzanej przypisanej przez użytkownika.
- `channels.msteams.sharePointSiteId`: identyfikator witryny SharePoint dla przesyłania plików w czatach grupowych/kanałach (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)).

## Routing i sesje

- Klucze sesji używają standardowego formatu agenta (zobacz [/concepts/session](/pl/concepts/session)):
  - Wiadomości bezpośrednie współdzielą główną sesję (`agent:<agentId>:<mainKey>`).
  - Wiadomości w kanałach/grupach używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki kontra wpisy

Teams niedawno wprowadził dwa style interfejsu kanałów działające na tym samym bazowym modelu danych:

| Styl                     | Opis                                                      | Zalecany `replyStyle` |
| ------------------------ | --------------------------------------------------------- | --------------------- |
| **Wpisy** (klasyczne)    | Wiadomości pojawiają się jako karty z odpowiedziami w wątku poniżej | `thread` (domyślnie)  |
| **Wątki** (podobne do Slacka) | Wiadomości płyną liniowo, bardziej jak w Slack          | `top-level`           |

**Problem:** API Teams nie ujawnia, którego stylu interfejsu używa kanał. Jeśli użyjesz niewłaściwego `replyStyle`:

- `thread` w kanale w stylu Wątków → odpowiedzi pojawiają się niezgrabnie zagnieżdżone
- `top-level` w kanale w stylu Wpisów → odpowiedzi pojawiają się jako osobne wpisy najwyższego poziomu zamiast w wątku

**Rozwiązanie:** Skonfiguruj `replyStyle` dla każdego kanału zgodnie z tym, jak kanał jest skonfigurowany:

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

### Priorytet rozwiązywania

Gdy bot wysyła odpowiedź do kanału, `replyStyle` jest rozwiązywany od najbardziej szczegółowego nadpisania do wartości domyślnej. Wygrywa pierwsza wartość inna niż `undefined`:

1. **Dla kanału** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Dla zespołu** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Globalnie** — `channels.msteams.replyStyle`
4. **Domyślna wartość niejawna** — wyprowadzona z `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Jeśli ustawisz `requireMention: false` globalnie bez jawnego `replyStyle`, wzmianki w kanałach w stylu Wpisów będą pojawiać się jako wpisy najwyższego poziomu, nawet gdy wiadomość przychodząca była odpowiedzią w wątku. Przypnij `replyStyle: "thread"` na poziomie globalnym, zespołu lub kanału, aby uniknąć niespodzianek.

### Zachowanie kontekstu wątku

Gdy obowiązuje `replyStyle: "thread"` i bot został @wspomniany z wnętrza wątku kanału, OpenClaw ponownie dołącza pierwotny korzeń wątku do referencji konwersacji wychodzącej (`19:…@thread.tacv2;messageid=<root>`), tak aby odpowiedź trafiła do tego samego wątku. Dotyczy to zarówno wysyłek na żywo (w trakcie tury), jak i wysyłek proaktywnych wykonywanych po wygaśnięciu kontekstu tury Bot Framework (np. długo działających agentów, kolejkowanych odpowiedzi na wywołania narzędzi przez `mcp__openclaw__message`).

Korzeń wątku jest pobierany z zapisanego `threadId` w referencji konwersacji. Starsze zapisane referencje, które poprzedzają `threadId`, cofają się do `activityId` (dowolnej aktywności przychodzącej, która ostatnio zainicjowała konwersację), więc istniejące wdrożenia nadal działają bez ponownego inicjowania.

Gdy obowiązuje `replyStyle: "top-level"`, wiadomości przychodzące z wątków kanału są celowo obsługiwane jako nowe wpisy najwyższego poziomu — nie jest dołączany żaden sufiks wątku. To poprawne zachowanie dla kanałów w stylu Wątków; jeśli widzisz wpisy najwyższego poziomu tam, gdzie oczekiwano odpowiedzi w wątku, `replyStyle` jest ustawiony niepoprawnie dla tego kanału.

## Załączniki i obrazy

**Obecne ograniczenia:**

- **DM:** Obrazy i załączniki plików działają przez API plików bota Teams.
- **Kanały/grupy:** Załączniki znajdują się w magazynie M365 (SharePoint/OneDrive). Ładunek Webhook zawiera tylko szablon HTML, a nie rzeczywiste bajty pliku. **Uprawnienia Graph API są wymagane** do pobierania załączników z kanałów.
- W przypadku jawnych wysyłek, w których plik jest pierwszy, użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalne `message` staje się towarzyszącym tekstem/komentarzem, a `filename` nadpisuje przesyłaną nazwę.

Bez uprawnień Graph wiadomości kanałowe z obrazami będą odbierane tylko jako tekst (zawartość obrazu nie jest dostępna dla bota).
Domyślnie OpenClaw pobiera multimedia tylko z nazw hostów Microsoft/Teams. Nadpisz to za pomocą `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane tylko dla hostów w `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph + Bot Framework). Utrzymuj tę listę restrykcyjną (unikaj sufiksów wielodzierżawowych).

## Wysyłanie plików w czatach grupowych

Boty mogą wysyłać pliki w DM przy użyciu przepływu FileConsentCard (wbudowanego). Jednak **wysyłanie plików w czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Kontekst                 | Jak wysyłane są pliki                         | Wymagana konfiguracja                          |
| ------------------------ | --------------------------------------------- | ---------------------------------------------- |
| **DM**                   | FileConsentCard → użytkownik akceptuje → bot przesyła | Działa od razu                                 |
| **Czaty grupowe/kanały** | Prześlij do SharePoint → udostępnij link      | Wymaga `sharePointSiteId` + uprawnień Graph    |
| **Obrazy (dowolny kontekst)** | Wbudowane w formacie Base64               | Działa od razu                                 |

### Dlaczego czaty grupowe wymagają SharePoint

Boty nie mają osobistego dysku OneDrive (punkt końcowy Graph API `/me/drive` nie działa dla tożsamości aplikacji). Aby wysyłać pliki w czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link udostępniania.

### Konfiguracja

1. **Dodaj uprawnienia Graph API** w Entra ID (Azure AD) → Rejestracja aplikacji:
   - `Sites.ReadWrite.All` (Aplikacja) - przesyłanie plików do SharePoint
   - `Chat.Read.All` (Aplikacja) - opcjonalne, włącza linki udostępniania dla użytkowników

2. **Przyznaj zgodę administratora** dla dzierżawy.

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

| Uprawnienie                              | Zachowanie udostępniania                                  |
| ---------------------------------------- | --------------------------------------------------------- |
| Tylko `Sites.ReadWrite.All`              | Link udostępniania w całej organizacji (dostęp ma każdy w organizacji) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Link udostępniania dla użytkowników (dostęp mają tylko członkowie czatu) |

Udostępnianie dla użytkowników jest bezpieczniejsze, ponieważ tylko uczestnicy czatu mogą uzyskać dostęp do pliku. Jeśli brakuje uprawnienia `Chat.Read.All`, bot cofa się do udostępniania w całej organizacji.

### Zachowanie awaryjne

| Scenariusz                                      | Wynik                                              |
| ----------------------------------------------- | -------------------------------------------------- |
| Czat grupowy + plik + skonfigurowane `sharePointSiteId` | Prześlij do SharePoint, wyślij link udostępniania |
| Czat grupowy + plik + brak `sharePointSiteId`   | Próba przesłania do OneDrive (może się nie udać), wyślij tylko tekst |
| Czat osobisty + plik                            | Przepływ FileConsentCard (działa bez SharePoint)   |
| Dowolny kontekst + obraz                        | Wbudowane w formacie Base64 (działa bez SharePoint) |

### Lokalizacja przechowywania plików

Przesłane pliki są przechowywane w folderze `/OpenClawShared/` w domyślnej bibliotece dokumentów skonfigurowanej witryny SharePoint.

## Ankiety (Adaptive Cards)

OpenClaw wysyła ankiety Teams jako Adaptive Cards (nie istnieje natywne API ankiet Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Gateway zapisuje głosy w `~/.openclaw/msteams-polls.json`.
- Gateway musi pozostać online, aby rejestrować głosy.
- Ankiety nie publikują jeszcze automatycznie podsumowań wyników (w razie potrzeby sprawdź plik magazynu).

## Karty prezentacyjne

Wysyłaj semantyczne ładunki prezentacji do użytkowników lub konwersacji Teams za pomocą narzędzia `message` albo CLI. OpenClaw renderuje je jako Teams Adaptive Cards na podstawie ogólnego kontraktu prezentacji.

Parametr `presentation` akceptuje bloki semantyczne. Gdy podano `presentation`, tekst wiadomości jest opcjonalny.

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

Cele MSTeams używają prefiksów do rozróżniania użytkowników i konwersacji:

| Typ celu            | Format                           | Przykład                                            |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Użytkownik (po ID)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Użytkownik (po nazwie) | `user:<display-name>`         | `user:John Smith` (wymaga Graph API)                |
| Grupa/kanał         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupa/kanał (surowy) | `<conversation-id>`             | `19:abc123...@thread.tacv2` (jeśli zawiera `@thread`) |

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

**Przykłady narzędzia agenta:**

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
Bez prefiksu `user:` nazwy domyślnie są rozpoznawane jako grupy lub zespoły. Zawsze używaj `user:`, gdy kierujesz wiadomość do osób po nazwie wyświetlanej.
</Note>

## Wiadomości proaktywne

- Wiadomości proaktywne są możliwe tylko **po** interakcji użytkownika, ponieważ wtedy zapisujemy odwołania do konwersacji.
- Zobacz `/gateway/configuration`, aby poznać `dmPolicy` i bramkowanie przez listę dozwolonych.

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

**Do konfiguracji:**

- Klucz zespołu = segment ścieżki po `/team/` (po zdekodowaniu URL, np. `19:Bk4j...@thread.tacv2`; starsi dzierżawcy mogą pokazywać `@thread.skype`, co również jest prawidłowe)
- Klucz kanału = segment ścieżki po `/channel/` (po zdekodowaniu URL)
- **Ignoruj** parametr zapytania `groupId` przy routingu OpenClaw. To identyfikator grupy Microsoft Entra, a nie identyfikator konwersacji Bot Framework używany w przychodzących aktywnościach Teams.

## Kanały prywatne

Boty mają ograniczoną obsługę kanałów prywatnych:

| Funkcja                      | Kanały standardowe | Kanały prywatne       |
| ---------------------------- | ------------------ | --------------------- |
| Instalacja bota              | Tak                | Ograniczona           |
| Wiadomości w czasie rzeczywistym (webhook) | Tak | Mogą nie działać      |
| Uprawnienia RSC              | Tak                | Mogą zachowywać się inaczej |
| @wzmianki                    | Tak                | Jeśli bot jest dostępny |
| Historia Graph API           | Tak                | Tak (z uprawnieniami) |

**Obejścia, jeśli kanały prywatne nie działają:**

1. Użyj kanałów standardowych do interakcji z botem
2. Użyj wiadomości DM - użytkownicy zawsze mogą wysłać wiadomość bezpośrednio do bota
3. Użyj Graph API do dostępu do historii (wymaga `ChannelMessage.Read.All`)

## Rozwiązywanie problemów

### Typowe problemy

- **Obrazy nie wyświetlają się w kanałach:** brakuje uprawnień Graph albo zgody administratora. Zainstaluj ponownie aplikację Teams i całkowicie zamknij oraz ponownie otwórz Teams.
- **Brak odpowiedzi w kanale:** wzmianki są domyślnie wymagane; ustaw `channels.msteams.requireMention=false` lub skonfiguruj ustawienie dla zespołu/kanału.
- **Niezgodność wersji (Teams nadal pokazuje stary manifest):** usuń i ponownie dodaj aplikację, a następnie całkowicie zamknij Teams, aby odświeżyć.
- **401 Unauthorized z webhooka:** oczekiwane podczas ręcznego testowania bez Azure JWT - oznacza, że punkt końcowy jest osiągalny, ale uwierzytelnienie nie powiodło się. Użyj Azure Web Chat, aby przetestować poprawnie.

### Błędy przesyłania manifestu

- **"Icon file cannot be empty":** manifest odwołuje się do plików ikon, które mają 0 bajtów. Utwórz prawidłowe ikony PNG (32x32 dla `outline.png`, 192x192 dla `color.png`).
- **"webApplicationInfo.Id already in use":** aplikacja nadal jest zainstalowana w innym zespole/czacie. Najpierw ją znajdź i odinstaluj albo poczekaj 5-10 minut na propagację.
- **"Something went wrong" podczas przesyłania:** zamiast tego prześlij przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otwórz DevTools przeglądarki (F12) → kartę Network i sprawdź treść odpowiedzi, aby zobaczyć rzeczywisty błąd.
- **Niepowodzenie sideloadu:** spróbuj opcji „Upload an app to your org's app catalog” zamiast „Upload a custom app” - często omija to ograniczenia sideloadu.

### Uprawnienia RSC nie działają

1. Sprawdź, czy `webApplicationInfo.id` dokładnie odpowiada App ID Twojego bota
2. Prześlij aplikację ponownie i zainstaluj ją ponownie w zespole/czacie
3. Sprawdź, czy administrator organizacji nie zablokował uprawnień RSC
4. Potwierdź, że używasz właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych

## Materiały referencyjne

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tworzenie aplikacji Teams i zarządzanie nimi
- [Schemat manifestu aplikacji Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Odbieranie wiadomości kanału z RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Dokumentacja uprawnień RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Obsługa plików przez bota Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanał/grupa wymaga Graph)
- [Wiadomości proaktywne](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI do zarządzania botami

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i utwardzanie
