---
read_when:
    - Arbeiten an Microsoft Teams-Kanalfunktionen
summary: Status der Bot-Unterstützung, Funktionen und Konfiguration für Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-11T20:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7bf8cd0ae6c6053f51794e6bc03bb6d927d640256272f3afb04f3b0ec99eb43
    source_path: channels/msteams.md
    workflow: 16
---

Status: Text + DM-Anhänge werden unterstützt; das Senden von Dateien in Kanälen/Gruppen erfordert `sharePointSiteId` + Graph-Berechtigungen (siehe [Senden von Dateien in Gruppenchats](#sending-files-in-group-chats)). Umfragen werden über Adaptive Cards gesendet. Nachrichtenaktionen stellen explizit `upload-file` für dateizentrierte Sendevorgänge bereit.

## Gebündeltes Plugin

Microsoft Teams wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher ist im normalen Paket-Build keine
separate Installation erforderlich.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die gebündeltes Teams ausschließt,
installieren Sie das npm-Paket direkt:

```bash
openclaw plugins install @openclaw/msteams
```

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
Version nur, wenn Sie eine reproduzierbare Installation benötigen.

Lokaler Checkout (bei Ausführung aus einem Git-Repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung

Die [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) übernimmt Bot-Registrierung, Manifest-Erstellung und Anmeldedaten-Generierung in einem einzigen Befehl.

**1. Installieren und anmelden**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Die Teams CLI befindet sich derzeit in der Vorschau. Befehle und Flags können sich zwischen Releases ändern.
</Note>

**2. Tunnel starten** (Teams kann localhost nicht erreichen)

Installieren und authentifizieren Sie die devtunnel CLI, falls noch nicht geschehen ([Einstiegsleitfaden](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` ist erforderlich, da Teams sich nicht bei devtunnels authentifizieren kann. Jede eingehende Bot-Anfrage wird weiterhin automatisch vom Teams SDK validiert.
</Note>

Alternativen: `ngrok http 3978` oder `tailscale funnel 3978` (diese können jedoch bei jeder Sitzung die URLs ändern).

**3. App erstellen**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Dieser einzelne Befehl:

- Erstellt eine Entra ID (Azure AD)-Anwendung
- Generiert ein Client Secret
- Erstellt ein Teams-App-Manifest (mit Icons) und lädt es hoch
- Registriert den Bot (standardmäßig von Teams verwaltet - kein Azure-Abonnement erforderlich)

Die Ausgabe zeigt `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` und eine **Teams App ID** - notieren Sie diese für die nächsten Schritte. Außerdem wird angeboten, die App direkt in Teams zu installieren.

**4. OpenClaw konfigurieren** mit den Anmeldedaten aus der Ausgabe:

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

Oder verwenden Sie Umgebungsvariablen direkt: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. App in Teams installieren**

`teams app create` fordert Sie auf, die App zu installieren - wählen Sie „Install in Teams“. Wenn Sie dies übersprungen haben, können Sie den Link später abrufen:

```bash
teams app get <teamsAppId> --install-link
```

**6. Prüfen, ob alles funktioniert**

```bash
teams app doctor <teamsAppId>
```

Dies führt Diagnosen für Bot-Registrierung, AAD-App-Konfiguration, Manifest-Gültigkeit und SSO-Einrichtung aus.

Für Produktionsbereitstellungen sollten Sie [föderierte Authentifizierung](/de/channels/msteams#federated-authentication-certificate-plus-managed-identity) (Zertifikat oder verwaltete Identität) statt Client Secrets erwägen.

<Note>
Gruppenchats sind standardmäßig blockiert (`channels.msteams.groupPolicy: "allowlist"`). Um Gruppenantworten zuzulassen, setzen Sie `channels.msteams.groupAllowFrom`, oder verwenden Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen (durch Erwähnung begrenzt).
</Note>

## Ziele

- Mit OpenClaw über Teams-DMs, Gruppenchats oder Kanäle sprechen.
- Routing deterministisch halten: Antworten gehen immer an den Kanal zurück, über den sie eingegangen sind.
- Standardmäßig sicheres Kanalverhalten verwenden (Erwähnungen erforderlich, sofern nicht anders konfiguriert).

## Konfigurationsschreibvorgänge

Standardmäßig darf Microsoft Teams Konfigurationsaktualisierungen schreiben, die durch `/config set|unset` ausgelöst werden (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Zugriffskontrolle (DMs + Gruppen)

**DM-Zugriff**

- Standard: `channels.msteams.dmPolicy = "pairing"`. Unbekannte Absender werden ignoriert, bis sie genehmigt sind.
- `channels.msteams.allowFrom` sollte stabile AAD-Objekt-IDs oder statische Absender-Zugriffsgruppen wie `accessGroup:core-team` verwenden.
- Verlassen Sie sich für Allowlists nicht auf UPN-/Anzeigenamen-Abgleich - diese können sich ändern. OpenClaw deaktiviert direkten Namensabgleich standardmäßig; aktivieren Sie ihn explizit mit `channels.msteams.dangerouslyAllowNameMatching: true`.
- Der Assistent kann Namen über Microsoft Graph in IDs auflösen, wenn die Anmeldedaten dies zulassen.

**Gruppenzugriff**

- Standard: `channels.msteams.groupPolicy = "allowlist"` (blockiert, sofern Sie `groupAllowFrom` nicht hinzufügen). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn er nicht gesetzt ist.
- `channels.msteams.groupAllowFrom` steuert, welche Absender oder statischen Absender-Zugriffsgruppen in Gruppenchats/Kanälen auslösen dürfen (fällt auf `channels.msteams.allowFrom` zurück).
- Setzen Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen (standardmäßig weiterhin durch Erwähnung begrenzt).
- Um **keine Kanäle** zuzulassen, setzen Sie `channels.msteams.groupPolicy: "disabled"`.

Beispiel:

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

**Teams + Kanal-Allowlist**

- Begrenzen Sie Gruppen-/Kanalantworten, indem Sie Teams und Kanäle unter `channels.msteams.teams` auflisten.
- Schlüssel sollten stabile Teams-Unterhaltungs-IDs aus Teams-Links verwenden, keine veränderlichen Anzeigenamen.
- Wenn `groupPolicy="allowlist"` und eine Teams-Allowlist vorhanden ist, werden nur aufgelistete Teams/Kanäle akzeptiert (durch Erwähnung begrenzt).
- Der Konfigurationsassistent akzeptiert `Team/Channel`-Einträge und speichert sie für Sie.
- Beim Start löst OpenClaw Team-/Kanal- und Benutzer-Allowlist-Namen in IDs auf (wenn Graph-Berechtigungen dies zulassen)
  und protokolliert die Zuordnung; nicht aufgelöste Team-/Kanalnamen werden wie eingegeben beibehalten, aber standardmäßig für das Routing ignoriert, sofern `channels.msteams.dangerouslyAllowNameMatching: true` nicht aktiviert ist.

Beispiel:

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
<summary><strong>Manuelle Einrichtung (ohne Teams CLI)</strong></summary>

Wenn Sie die Teams CLI nicht verwenden können, können Sie den Bot manuell über das Azure Portal einrichten.

### Funktionsweise

1. Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist (in aktuellen Releases gebündelt).
2. Erstellen Sie einen **Azure Bot** (App-ID + Secret + Tenant-ID).
3. Erstellen Sie ein **Teams-App-Paket**, das auf den Bot verweist und die untenstehenden RSC-Berechtigungen enthält.
4. Laden/installieren Sie die Teams-App in ein Team (oder in den persönlichen Geltungsbereich für DMs) hoch.
5. Konfigurieren Sie `msteams` in `~/.openclaw/openclaw.json` (oder Env Vars) und starten Sie den Gateway.
6. Der Gateway lauscht standardmäßig unter `/api/messages` auf Bot Framework-Webhook-Traffic.

### Schritt 1: Azure Bot erstellen

1. Gehen Sie zu [Azure Bot erstellen](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Füllen Sie den Tab **Basics** aus:

   | Feld               | Wert                                                     |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Ihr Bot-Name, z. B. `openclaw-msteams` (muss eindeutig sein) |
   | **Subscription**   | Wählen Sie Ihr Azure-Abonnement                          |
   | **Resource group** | Neu erstellen oder vorhandene verwenden                  |
   | **Pricing tier**   | **Free** für Entwicklung/Tests                           |
   | **Type of App**    | **Single Tenant** (empfohlen - siehe Hinweis unten)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Die Erstellung neuer Multi-Tenant-Bots wurde nach dem 2025-07-31 eingestellt. Verwenden Sie **Single Tenant** für neue Bots.
</Warning>

3. Klicken Sie auf **Review + create** → **Create** (warten Sie ca. 1-2 Minuten)

### Schritt 2: Anmeldedaten abrufen

1. Gehen Sie zu Ihrer Azure Bot-Ressource → **Configuration**
2. Kopieren Sie **Microsoft App ID** → dies ist Ihre `appId`
3. Klicken Sie auf **Manage Password** → gehen Sie zur App-Registrierung
4. Unter **Certificates & secrets** → **New client secret** → kopieren Sie den **Value** → dies ist Ihr `appPassword`
5. Gehen Sie zu **Overview** → kopieren Sie **Directory (tenant) ID** → dies ist Ihre `tenantId`

### Schritt 3: Messaging-Endpunkt konfigurieren

1. In Azure Bot → **Configuration**
2. Setzen Sie **Messaging endpoint** auf Ihre Webhook-URL:
   - Produktion: `https://your-domain.com/api/messages`
   - Lokale Entwicklung: Verwenden Sie einen Tunnel (siehe [Lokale Entwicklung](#local-development-tunneling) unten)

### Schritt 4: Teams-Kanal aktivieren

1. In Azure Bot → **Channels**
2. Klicken Sie auf **Microsoft Teams** → Configure → Save
3. Akzeptieren Sie die Nutzungsbedingungen

### Schritt 5: Teams-App-Manifest erstellen

- Fügen Sie einen `bot`-Eintrag mit `botId = <App ID>` hinzu.
- Geltungsbereiche: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (erforderlich für Dateiverarbeitung im persönlichen Geltungsbereich).
- Fügen Sie RSC-Berechtigungen hinzu (siehe [RSC-Berechtigungen](#current-teams-rsc-permissions-manifest)).
- Erstellen Sie Icons: `outline.png` (32x32) und `color.png` (192x192).
- Zippen Sie alle drei Dateien zusammen: `manifest.json`, `outline.png`, `color.png`.

### Schritt 6: OpenClaw konfigurieren

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

Umgebungsvariablen: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Schritt 7: Gateway ausführen

Der Teams-Kanal startet automatisch, wenn das Plugin verfügbar ist und eine `msteams`-Konfiguration mit Anmeldedaten vorhanden ist.

</details>

## Föderierte Authentifizierung (Zertifikat plus verwaltete Identität)

> Hinzugefügt in 2026.4.11

Für Produktionsbereitstellungen unterstützt OpenClaw **föderierte Authentifizierung** als sicherere Alternative zu Client Secrets. Zwei Methoden sind verfügbar:

### Option A: Zertifikatbasierte Authentifizierung

Verwenden Sie ein PEM-Zertifikat, das bei Ihrer Entra ID-App-Registrierung registriert ist.

**Einrichtung:**

1. Generieren oder beschaffen Sie ein Zertifikat (PEM-Format mit privatem Schlüssel).
2. In Entra ID → App-Registrierung → **Certificates & secrets** → **Certificates** → laden Sie das öffentliche Zertifikat hoch.

**Konfiguration:**

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

**Env Vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Option B: Azure Managed Identity

Verwenden Sie Azure Managed Identity für passwortlose Authentifizierung. Dies ist ideal für Bereitstellungen auf Azure-Infrastruktur (AKS, App Service, Azure VMs), bei denen eine verwaltete Identität verfügbar ist.

**Funktionsweise:**

1. Der Bot-Pod/die VM verfügt über eine verwaltete Identität (systemseitig zugewiesen oder benutzerseitig zugewiesen).
2. Ein **federated identity credential** verknüpft die verwaltete Identität mit der Entra ID-App-Registrierung.
3. Zur Laufzeit verwendet OpenClaw `@azure/identity`, um Tokens vom Azure IMDS-Endpunkt (`169.254.169.254`) abzurufen.
4. Das Token wird zur Bot-Authentifizierung an das Teams SDK übergeben.

**Voraussetzungen:**

- Azure-Infrastruktur mit aktivierter verwalteter Identität (AKS Workload Identity, App Service, VM)
- Federated Identity Credential, das in der Entra ID-App-Registrierung erstellt wurde
- Netzwerkzugriff auf IMDS (`169.254.169.254:80`) vom Pod/von der VM

**Konfiguration (systemseitig zugewiesene verwaltete Identität):**

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

**Konfiguration (benutzerzugewiesene verwaltete Identität):**

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

**Umgebungsvariablen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (nur für benutzerzugewiesene)

### Einrichtung der AKS Workload Identity

Für AKS-Bereitstellungen mit Workload Identity:

1. **Aktivieren Sie Workload Identity** in Ihrem AKS-Cluster.
2. **Erstellen Sie eine föderierte Identitätsanmeldeinformation** in der Entra ID-App-Registrierung:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annotieren Sie das Kubernetes-Dienstkonto** mit der App-Client-ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Kennzeichnen Sie den Pod** für die Injektion der Workload Identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Stellen Sie den Netzwerkzugriff** auf IMDS (`169.254.169.254`) sicher. Wenn Sie NetworkPolicy verwenden, fügen Sie eine Egress-Regel hinzu, die Datenverkehr zu `169.254.169.254/32` auf Port 80 zulässt.

### Vergleich der Authentifizierungstypen

| Methode                 | Konfiguration                                  | Vorteile                                      | Nachteile                                            |
| ----------------------- | ---------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| **Client-Geheimnis**    | `appPassword`                                  | Einfache Einrichtung                          | Geheimnisrotation erforderlich, weniger sicher       |
| **Zertifikat**          | `authType: "federated"` + `certificatePath`    | Kein gemeinsames Geheimnis über das Netzwerk  | Aufwand für Zertifikatsverwaltung                    |
| **Managed Identity**    | `authType: "federated"` + `useManagedIdentity` | Kennwortlos, keine zu verwaltenden Geheimnisse | Azure-Infrastruktur erforderlich                     |

**Standardverhalten:** Wenn `authType` nicht gesetzt ist, verwendet OpenClaw standardmäßig die Authentifizierung per Client-Geheimnis. Vorhandene Konfigurationen funktionieren ohne Änderungen weiter.

## Lokale Entwicklung (Tunneling)

Teams kann `localhost` nicht erreichen. Verwenden Sie einen persistenten Entwicklungstunnel, damit Ihre URL über Sitzungen hinweg gleich bleibt:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternativen: `ngrok http 3978` oder `tailscale funnel 3978` (URLs können sich pro Sitzung ändern).

Wenn sich Ihre Tunnel-URL ändert, aktualisieren Sie den Endpunkt:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Bot testen

**Diagnose ausführen:**

```bash
teams app doctor <teamsAppId>
```

Prüft Bot-Registrierung, AAD-App, Manifest und SSO-Konfiguration in einem Durchlauf.

**Testnachricht senden:**

1. Installieren Sie die Teams-App (verwenden Sie den Installationslink aus `teams app get <id> --install-link`)
2. Suchen Sie den Bot in Teams und senden Sie eine DM
3. Prüfen Sie die Gateway-Protokolle auf eingehende Aktivität

## Umgebungsvariablen

Alle Konfigurationsschlüssel können stattdessen über Umgebungsvariablen gesetzt werden:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (optional: `"secret"` oder `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (föderiert + Zertifikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (optional, für Authentifizierung nicht erforderlich)
- `MSTEAMS_USE_MANAGED_IDENTITY` (föderiert + Managed Identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (nur benutzerzugewiesene MI)

## Aktion für Mitgliedsinformationen

OpenClaw stellt eine Graph-gestützte `member-info`-Aktion für Microsoft Teams bereit, damit Agenten und Automatisierungen Details zu Kanalmitgliedern (Anzeigename, E-Mail, Rolle) direkt aus Microsoft Graph auflösen können.

Anforderungen:

- `Member.Read.Group`-RSC-Berechtigung (bereits im empfohlenen Manifest enthalten)
- Für teamübergreifende Suchvorgänge: `User.Read.All`-Graph-Anwendungsberechtigung mit Administratoreinwilligung

Die Aktion wird durch `channels.msteams.actions.memberInfo` gesteuert (Standard: aktiviert, wenn Graph-Anmeldeinformationen verfügbar sind).

## Verlaufskontext

- `channels.msteams.historyLimit` steuert, wie viele aktuelle Kanal-/Gruppennachrichten in den Prompt eingebunden werden.
- Fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um dies zu deaktivieren (Standard 50).
- Der abgerufene Thread-Verlauf wird nach Absender-Zulassungslisten (`allowFrom` / `groupAllowFrom`) gefiltert, sodass die Initialisierung des Thread-Kontexts nur Nachrichten von erlaubten Absendern enthält.
- Zitierter Anhangskontext (aus Teams-Antwort-HTML abgeleitetes `ReplyTo*`) wird derzeit unverändert weitergegeben.
- Anders gesagt: Zulassungslisten steuern, wer den Agenten auslösen kann; derzeit werden nur bestimmte ergänzende Kontextpfade gefiltert.
- Der DM-Verlauf kann mit `channels.msteams.dmHistoryLimit` begrenzt werden (Benutzer-Turns). Pro-Benutzer-Überschreibungen: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktuelle Teams-RSC-Berechtigungen (Manifest)

Dies sind die **vorhandenen resourceSpecific-Berechtigungen** in unserem Teams-App-Manifest. Sie gelten nur innerhalb des Teams/Chats, in dem die App installiert ist.

**Für Kanäle (Team-Scope):**

- `ChannelMessage.Read.Group` (Anwendung) - alle Kanalnachrichten ohne @mention empfangen
- `ChannelMessage.Send.Group` (Anwendung)
- `Member.Read.Group` (Anwendung)
- `Owner.Read.Group` (Anwendung)
- `ChannelSettings.Read.Group` (Anwendung)
- `TeamMember.Read.Group` (Anwendung)
- `TeamSettings.Read.Group` (Anwendung)

**Für Gruppenchats:**

- `ChatMessage.Read.Chat` (Anwendung) - alle Gruppenchatnachrichten ohne @mention empfangen

So fügen Sie RSC-Berechtigungen über die Teams CLI hinzu:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Beispiel für ein Teams-Manifest (redigiert)

Minimales, gültiges Beispiel mit den erforderlichen Feldern. Ersetzen Sie IDs und URLs.

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

### Manifest-Hinweise (erforderliche Felder)

- `bots[].botId` **muss** mit der Azure Bot-App-ID übereinstimmen.
- `webApplicationInfo.id` **muss** mit der Azure Bot-App-ID übereinstimmen.
- `bots[].scopes` muss die Oberflächen enthalten, die Sie verwenden möchten (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` ist für die Dateiverarbeitung im persönlichen Scope erforderlich.
- `authorization.permissions.resourceSpecific` muss Lesen/Senden für Kanäle enthalten, wenn Sie Kanalverkehr nutzen möchten.

### Eine vorhandene App aktualisieren

So aktualisieren Sie eine bereits installierte Teams-App (z. B. um RSC-Berechtigungen hinzuzufügen):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Installieren Sie die App nach der Aktualisierung in jedem Team neu, damit neue Berechtigungen wirksam werden, und **beenden Sie Teams vollständig und starten Sie es neu** (nicht nur das Fenster schließen), um zwischengespeicherte App-Metadaten zu löschen.

<details>
<summary>Manuelle Manifest-Aktualisierung (ohne CLI)</summary>

1. Aktualisieren Sie Ihre `manifest.json` mit den neuen Einstellungen
2. **Erhöhen Sie das Feld `version`** (z. B. `1.0.0` → `1.1.0`)
3. **Packen Sie** das Manifest mit Symbolen erneut als ZIP-Datei (`manifest.json`, `outline.png`, `color.png`)
4. Laden Sie die neue ZIP-Datei hoch:
   - **Teams Admin Center:** Teams-Apps → Apps verwalten → Ihre App suchen → Neue Version hochladen
   - **Querladen:** In Teams → Apps → Ihre Apps verwalten → Benutzerdefinierte App hochladen

</details>

## Funktionen: nur RSC vs. Graph

### Mit **nur Teams RSC** (App installiert, keine Graph API-Berechtigungen)

Funktioniert:

- **Text**inhalt von Kanalnachrichten lesen.
- **Text**inhalt von Kanalnachrichten senden.
- Dateianhänge in **persönlichen Nachrichten (DM)** empfangen.

Funktioniert NICHT:

- **Bild- oder Dateiinhalte** in Kanälen/Gruppen (Payload enthält nur HTML-Stub).
- Herunterladen von in SharePoint/OneDrive gespeicherten Anhängen.
- Lesen des Nachrichtenverlaufs (über das Live-Webhook-Ereignis hinaus).

### Mit **Teams RSC + Microsoft Graph-Anwendungsberechtigungen**

Ergänzt:

- Herunterladen gehosteter Inhalte (in Nachrichten eingefügte Bilder).
- Herunterladen von in SharePoint/OneDrive gespeicherten Dateianhängen.
- Lesen des Kanal-/Chatnachrichtenverlaufs über Graph.

### RSC vs. Graph API

| Funktion                    | RSC-Berechtigungen   | Graph API                                      |
| --------------------------- | -------------------- | ---------------------------------------------- |
| **Echtzeitnachrichten**     | Ja (per Webhook)     | Nein (nur Polling)                             |
| **Historische Nachrichten** | Nein                 | Ja (Verlauf kann abgefragt werden)             |
| **Einrichtungsaufwand**     | Nur App-Manifest     | Erfordert Administratoreinwilligung + Tokenfluss |
| **Funktioniert offline**    | Nein (muss laufen)   | Ja (jederzeit abfragbar)                       |

**Kurz gesagt:** RSC ist für Echtzeit-Listening gedacht; Graph API ist für historischen Zugriff gedacht. Um verpasste Nachrichten nach einer Offline-Phase nachzuholen, benötigen Sie Graph API mit `ChannelMessage.Read.All` (erfordert Administratoreinwilligung).

## Graph-aktivierte Medien + Verlauf (für Kanäle erforderlich)

Wenn Sie Bilder/Dateien in **Kanälen** benötigen oder den **Nachrichtenverlauf** abrufen möchten, müssen Sie Microsoft Graph-Berechtigungen aktivieren und Administratoreinwilligung erteilen.

1. Fügen Sie in der Entra ID (Azure AD) **App-Registrierung** Microsoft Graph-**Anwendungsberechtigungen** hinzu:
   - `ChannelMessage.Read.All` (Kanalanhänge + Verlauf)
   - `Chat.Read.All` oder `ChatMessage.Read.All` (Gruppenchats)
2. **Erteilen Sie Administratoreinwilligung** für den Mandanten.
3. Erhöhen Sie die **Manifestversion** der Teams-App, laden Sie sie erneut hoch und **installieren Sie die App in Teams neu**.
4. **Beenden Sie Teams vollständig und starten Sie es neu**, um zwischengespeicherte App-Metadaten zu löschen.

**Zusätzliche Berechtigung für Benutzererwähnungen:** Benutzer-@mentions funktionieren für Benutzer in der Unterhaltung direkt. Wenn Sie jedoch Benutzer, die **nicht in der aktuellen Unterhaltung** sind, dynamisch suchen und erwähnen möchten, fügen Sie die Berechtigung `User.Read.All` (Anwendung) hinzu und erteilen Sie Administratoreinwilligung.

## Bekannte Einschränkungen

### Webhook-Zeitüberschreitungen

Teams liefert Nachrichten per HTTP-Webhook aus. Wenn die Verarbeitung zu lange dauert (z. B. langsame LLM-Antworten), kann Folgendes auftreten:

- Gateway-Zeitüberschreitungen
- Teams versucht erneut, die Nachricht zuzustellen (führt zu Duplikaten)
- Verworfene Antworten

OpenClaw behandelt dies, indem es schnell zurückkehrt und Antworten proaktiv sendet, aber sehr langsame Antworten können weiterhin Probleme verursachen.

### Formatierung

Teams-Markdown ist stärker eingeschränkt als Slack oder Discord:

- Grundlegende Formatierung funktioniert: **fett**, _kursiv_, `code`, Links
- Komplexes Markdown (Tabellen, verschachtelte Listen) wird möglicherweise nicht korrekt dargestellt
- Adaptive Cards werden für Umfragen und semantische Präsentationssendungen unterstützt (siehe unten)

## Konfiguration

Wichtige Einstellungen (gemeinsame Kanalmuster siehe `/gateway/configuration`):

- `channels.msteams.enabled`: Kanal aktivieren/deaktivieren.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: Bot-Anmeldedaten.
- `channels.msteams.webhook.port` (Standard `3978`)
- `channels.msteams.webhook.path` (Standard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: Pairing)
- `channels.msteams.allowFrom`: DM-Allowlist (AAD-Objekt-IDs empfohlen). Der Assistent löst Namen während der Einrichtung in IDs auf, wenn Graph-Zugriff verfügbar ist.
- `channels.msteams.dangerouslyAllowNameMatching`: Notfall-Umschalter, um änderbares UPN-/Anzeigenamen-Matching und direktes Routing nach Team-/Kanalnamen wieder zu aktivieren.
- `channels.msteams.textChunkLimit`: Blockgröße für ausgehenden Text.
- `channels.msteams.chunkMode`: `length` (Standard) oder `newline`, um vor der längenbasierten Aufteilung an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.msteams.mediaAllowHosts`: Allowlist für eingehende Anhang-Hosts (standardmäßig Microsoft-/Teams-Domains).
- `channels.msteams.mediaAuthAllowHosts`: Allowlist für das Anhängen von Authorization-Headern bei Medien-Wiederholungen (standardmäßig Graph- und Bot-Framework-Hosts).
- `channels.msteams.requireMention`: @Mention in Kanälen/Gruppen verlangen (Standard true).
- `channels.msteams.replyStyle`: `thread | top-level` (siehe [Antwortstil](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.requireMention`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.tools`: Standardmäßige Tool-Richtlinienüberschreibungen pro Team (`allow`/`deny`/`alsoAllow`), die verwendet werden, wenn eine Kanalüberschreibung fehlt.
- `channels.msteams.teams.<teamId>.toolsBySender`: Standardmäßige Tool-Richtlinienüberschreibungen pro Team und Absender (`"*"`-Wildcard unterstützt).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: Tool-Richtlinienüberschreibungen pro Kanal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: Tool-Richtlinienüberschreibungen pro Kanal und Absender (`"*"`-Wildcard unterstützt).
- `toolsBySender`-Schlüssel sollten explizite Präfixe verwenden:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (alte Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet).
- `channels.msteams.actions.memberInfo`: die Graph-gestützte Mitgliedsinformationsaktion aktivieren oder deaktivieren (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).
- `channels.msteams.authType`: Authentifizierungstyp - `"secret"` (Standard) oder `"federated"`.
- `channels.msteams.certificatePath`: Pfad zur PEM-Zertifikatsdatei (föderierte Authentifizierung + Zertifikatsauthentifizierung).
- `channels.msteams.certificateThumbprint`: Zertifikat-Fingerabdruck (optional, für die Authentifizierung nicht erforderlich).
- `channels.msteams.useManagedIdentity`: Managed-Identity-Authentifizierung aktivieren (föderierter Modus).
- `channels.msteams.managedIdentityClientId`: Client-ID für benutzerseitig zugewiesene Managed Identity.
- `channels.msteams.sharePointSiteId`: SharePoint-Site-ID für Datei-Uploads in Gruppenchats/Kanälen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)).

## Routing und Sitzungen

- Sitzungsschlüssel folgen dem Standardformat für Agenten (siehe [/concepts/session](/de/concepts/session)):
  - Direktnachrichten teilen sich die Hauptsitzung (`agent:<agentId>:<mainKey>`).
  - Kanal-/Gruppennachrichten verwenden die Konversations-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwortstil: Threads im Vergleich zu Beiträgen

Teams hat kürzlich zwei Kanal-UI-Stile über demselben zugrunde liegenden Datenmodell eingeführt:

| Stil                     | Beschreibung                                               | Empfohlener `replyStyle` |
| ------------------------ | ---------------------------------------------------------- | ------------------------ |
| **Beiträge** (klassisch) | Nachrichten erscheinen als Karten mit Thread-Antworten darunter | `thread` (Standard)      |
| **Threads** (Slack-ähnlich) | Nachrichten fließen linear, eher wie in Slack           | `top-level`              |

**Das Problem:** Die Teams API gibt nicht an, welchen UI-Stil ein Kanal verwendet. Wenn Sie den falschen `replyStyle` verwenden:

- `thread` in einem Kanal im Threads-Stil → Antworten erscheinen unpassend verschachtelt
- `top-level` in einem Kanal im Beiträge-Stil → Antworten erscheinen als separate Top-Level-Beiträge statt innerhalb des Threads

**Lösung:** Konfigurieren Sie `replyStyle` pro Kanal basierend darauf, wie der Kanal eingerichtet ist:

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

### Auflösungsreihenfolge

Wenn der Bot eine Antwort in einen Kanal sendet, wird `replyStyle` von der spezifischsten Überschreibung bis zum Standard aufgelöst. Der erste Wert, der nicht `undefined` ist, gewinnt:

1. **Pro Kanal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Pro Team** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Impliziter Standard** — abgeleitet von `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Wenn Sie `requireMention: false` global ohne expliziten `replyStyle` setzen, werden Mentions in Kanälen im Beiträge-Stil als Top-Level-Beiträge angezeigt, selbst wenn der Eingang eine Thread-Antwort war. Setzen Sie `replyStyle: "thread"` auf globaler, Team- oder Kanalebene fest, um Überraschungen zu vermeiden.

### Beibehaltung des Thread-Kontexts

Wenn `replyStyle: "thread"` wirksam ist und der Bot aus einem Kanal-Thread heraus per @Mention angesprochen wurde, hängt OpenClaw den ursprünglichen Thread-Root wieder an die ausgehende Konversationsreferenz an (`19:…@thread.tacv2;messageid=<root>`), damit die Antwort im selben Thread landet. Das gilt sowohl für Live-Sendungen (innerhalb des Turns) als auch für proaktive Sendungen, die erfolgen, nachdem der Bot-Framework-Turn-Kontext abgelaufen ist (z. B. lang laufende Agenten, eingereihte Tool-Call-Antworten über `mcp__openclaw__message`).

Der Thread-Root wird aus der gespeicherten `threadId` in der Konversationsreferenz entnommen. Ältere gespeicherte Referenzen, die vor `threadId` erstellt wurden, fallen auf `activityId` zurück (die eingehende Aktivität, die zuletzt die Konversation initialisiert hat), sodass bestehende Bereitstellungen ohne erneute Initialisierung weiter funktionieren.

Wenn `replyStyle: "top-level"` wirksam ist, werden eingehende Kanal-Threads absichtlich als neue Top-Level-Beiträge beantwortet — es wird kein Thread-Suffix angehängt. Das ist das korrekte Verhalten für Kanäle im Threads-Stil; wenn Sie Top-Level-Beiträge sehen, obwohl Sie Thread-Antworten erwartet haben, ist Ihr `replyStyle` für diesen Kanal falsch gesetzt.

## Anhänge und Bilder

**Aktuelle Einschränkungen:**

- **DMs:** Bilder und Dateianhänge funktionieren über Teams-Bot-Datei-APIs.
- **Kanäle/Gruppen:** Anhänge liegen in M365-Speicher (SharePoint/OneDrive). Die Webhook-Nutzlast enthält nur einen HTML-Stub, nicht die eigentlichen Dateibytes. **Graph API-Berechtigungen sind erforderlich**, um Kanalanhänge herunterzuladen.
- Für explizite datei-zuerst-Sendungen verwenden Sie `action=upload-file` mit `media` / `filePath` / `path`; die optionale `message` wird zum begleitenden Text/Kommentar, und `filename` überschreibt den hochgeladenen Namen.

Ohne Graph-Berechtigungen werden Kanalnachrichten mit Bildern nur als Text empfangen (der Bildinhalt ist für den Bot nicht zugänglich).
Standardmäßig lädt OpenClaw Medien nur von Microsoft-/Teams-Hostnamen herunter. Überschreiben Sie dies mit `channels.msteams.mediaAllowHosts` (verwenden Sie `["*"]`, um jeden Host zuzulassen).
Authorization-Header werden nur für Hosts in `channels.msteams.mediaAuthAllowHosts` angehängt (standardmäßig Graph- und Bot-Framework-Hosts). Halten Sie diese Liste strikt (vermeiden Sie mandantenübergreifende Suffixe).

## Dateien in Gruppenchats senden

Bots können Dateien in DMs über den FileConsentCard-Flow senden (integriert). **Das Senden von Dateien in Gruppenchats/Kanälen** erfordert jedoch zusätzliche Einrichtung:

| Kontext                  | Wie Dateien gesendet werden                  | Erforderliche Einrichtung                      |
| ------------------------ | -------------------------------------------- | ---------------------------------------------- |
| **DMs**                  | FileConsentCard → Benutzer akzeptiert → Bot lädt hoch | Funktioniert sofort                     |
| **Gruppenchats/Kanäle**  | Upload zu SharePoint → Freigabelink          | Erfordert `sharePointSiteId` + Graph-Berechtigungen |
| **Bilder (jeder Kontext)** | Base64-kodiert inline                      | Funktioniert sofort                            |

### Warum Gruppenchats SharePoint benötigen

Bots haben kein persönliches OneDrive-Laufwerk (der Graph API-Endpunkt `/me/drive` funktioniert nicht für Anwendungsidentitäten). Um Dateien in Gruppenchats/Kanälen zu senden, lädt der Bot sie auf eine **SharePoint-Site** hoch und erstellt einen Freigabelink.

### Einrichtung

1. **Graph API-Berechtigungen hinzufügen** in Entra ID (Azure AD) → App-Registrierung:
   - `Sites.ReadWrite.All` (Anwendung) - Dateien nach SharePoint hochladen
   - `Chat.Read.All` (Anwendung) - optional, aktiviert Freigabelinks pro Benutzer

2. **Administratorzustimmung** für den Mandanten erteilen.

3. **Ihre SharePoint-Site-ID abrufen:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw konfigurieren:**

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

### Freigabeverhalten

| Berechtigung                            | Freigabeverhalten                                       |
| --------------------------------------- | ------------------------------------------------------- |
| Nur `Sites.ReadWrite.All`               | Organisationsweiter Freigabelink (jeder in der Organisation kann zugreifen) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Freigabelink pro Benutzer (nur Chatmitglieder können zugreifen) |

Freigabe pro Benutzer ist sicherer, da nur die Chat-Teilnehmer auf die Datei zugreifen können. Wenn die Berechtigung `Chat.Read.All` fehlt, fällt der Bot auf organisationsweite Freigabe zurück.

### Fallback-Verhalten

| Szenario                                          | Ergebnis                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| Gruppenchat + Datei + `sharePointSiteId` konfiguriert | Upload zu SharePoint, Freigabelink senden     |
| Gruppenchat + Datei + kein `sharePointSiteId`     | OneDrive-Upload versuchen (kann fehlschlagen), nur Text senden |
| Persönlicher Chat + Datei                         | FileConsentCard-Flow (funktioniert ohne SharePoint) |
| Beliebiger Kontext + Bild                         | Base64-kodiert inline (funktioniert ohne SharePoint) |

### Speicherort von Dateien

Hochgeladene Dateien werden in einem `/OpenClawShared/`-Ordner in der Standard-Dokumentbibliothek der konfigurierten SharePoint-Site gespeichert.

## Umfragen (Adaptive Cards)

OpenClaw sendet Teams-Umfragen als Adaptive Cards (es gibt keine native Teams-Umfrage-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stimmen werden vom Gateway in `~/.openclaw/msteams-polls.json` aufgezeichnet.
- Das Gateway muss online bleiben, um Stimmen aufzuzeichnen.
- Umfragen veröffentlichen noch keine Ergebniszusammenfassungen automatisch (prüfen Sie bei Bedarf die Store-Datei).

## Präsentationskarten

Senden Sie semantische Präsentations-Payloads mit dem `message`-Tool oder der CLI an Teams-Benutzer oder Unterhaltungen. OpenClaw rendert sie als Teams Adaptive Cards aus dem generischen Präsentationsvertrag.

Der Parameter `presentation` akzeptiert semantische Blöcke. Wenn `presentation` angegeben ist, ist der Nachrichtentext optional.

**Agent-Tool:**

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

Details zum Zielformat finden Sie unten unter [Zielformate](#target-formats).

## Zielformate

MSTeams-Ziele verwenden Präfixe, um zwischen Benutzern und Unterhaltungen zu unterscheiden:

| Zieltyp              | Format                           | Beispiel                                            |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Benutzer (nach ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Benutzer (nach Name) | `user:<display-name>`            | `user:John Smith` (erfordert Graph API)             |
| Gruppe/Kanal         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Gruppe/Kanal (roh)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (wenn `@thread` enthalten ist) |

**CLI-Beispiele:**

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

**Beispiele für das Agent-Tool:**

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
Ohne das Präfix `user:` werden Namen standardmäßig als Gruppe oder Team aufgelöst. Verwenden Sie immer `user:`, wenn Sie Personen anhand ihres Anzeigenamens adressieren.
</Note>

## Proaktives Messaging

- Proaktive Nachrichten sind nur möglich, **nachdem** ein Benutzer interagiert hat, da wir zu diesem Zeitpunkt Unterhaltungsreferenzen speichern.
- Siehe `/gateway/configuration` für `dmPolicy` und Allowlist-Gating.

## Team- und Kanal-IDs (häufiger Stolperstein)

Der Abfrageparameter `groupId` in Teams-URLs ist **NICHT** die Team-ID, die für die Konfiguration verwendet wird. Extrahieren Sie IDs stattdessen aus dem URL-Pfad:

**Team-URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**Kanal-URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Für die Konfiguration:**

- Team-Schlüssel = Pfadsegment nach `/team/` (URL-dekodiert, z. B. `19:Bk4j...@thread.tacv2`; ältere Mandanten können `@thread.skype` anzeigen, was ebenfalls gültig ist)
- Kanal-Schlüssel = Pfadsegment nach `/channel/` (URL-dekodiert)
- **Ignorieren** Sie den Abfrageparameter `groupId` für OpenClaw-Routing. Es handelt sich um die Microsoft Entra-Gruppen-ID, nicht um die Bot Framework-Unterhaltungs-ID, die in eingehenden Teams-Aktivitäten verwendet wird.

## Private Kanäle

Bots haben in privaten Kanälen eingeschränkte Unterstützung:

| Funktion                     | Standardkanäle | Private Kanäle                |
| ---------------------------- | -------------- | ----------------------------- |
| Bot-Installation             | Ja             | Eingeschränkt                 |
| Echtzeitnachrichten (Webhook) | Ja             | Funktioniert möglicherweise nicht |
| RSC-Berechtigungen           | Ja             | Können sich anders verhalten  |
| @mentions                    | Ja             | Wenn der Bot zugänglich ist   |
| Graph API-Verlauf            | Ja             | Ja (mit Berechtigungen)       |

**Problemumgehungen, falls private Kanäle nicht funktionieren:**

1. Verwenden Sie Standardkanäle für Bot-Interaktionen
2. Verwenden Sie DMs - Benutzer können dem Bot immer direkt Nachrichten senden
3. Verwenden Sie Graph API für historischen Zugriff (erfordert `ChannelMessage.Read.All`)

## Fehlerbehebung

### Häufige Probleme

- **Bilder werden in Kanälen nicht angezeigt:** Graph-Berechtigungen oder Admin-Zustimmung fehlen. Installieren Sie die Teams-App neu und beenden/öffnen Sie Teams vollständig neu.
- **Keine Antworten im Kanal:** Erwähnungen sind standardmäßig erforderlich; setzen Sie `channels.msteams.requireMention=false` oder konfigurieren Sie dies pro Team/Kanal.
- **Versionskonflikt (Teams zeigt weiterhin altes Manifest):** Entfernen Sie die App, fügen Sie sie erneut hinzu und beenden Sie Teams vollständig, um es zu aktualisieren.
- **401 Unauthorized vom Webhook:** Erwartet bei manuellen Tests ohne Azure JWT - bedeutet, dass der Endpunkt erreichbar ist, die Authentifizierung aber fehlgeschlagen ist. Verwenden Sie Azure Web Chat, um korrekt zu testen.

### Fehler beim Manifest-Upload

- **"Icon file cannot be empty":** Das Manifest verweist auf Icon-Dateien mit 0 Byte. Erstellen Sie gültige PNG-Icons (32x32 für `outline.png`, 192x192 für `color.png`).
- **"webApplicationInfo.Id already in use":** Die App ist noch in einem anderen Team/Chat installiert. Suchen und deinstallieren Sie sie zuerst, oder warten Sie 5-10 Minuten auf die Verteilung.
- **"Something went wrong" beim Upload:** Laden Sie stattdessen über [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) hoch, öffnen Sie die Browser-DevTools (F12) → Registerkarte Network, und prüfen Sie den Antworttext auf den tatsächlichen Fehler.
- **Sideload schlägt fehl:** Versuchen Sie "Upload an app to your org's app catalog" statt "Upload a custom app" - dadurch werden Sideload-Einschränkungen oft umgangen.

### RSC-Berechtigungen funktionieren nicht

1. Stellen Sie sicher, dass `webApplicationInfo.id` exakt mit der App-ID Ihres Bots übereinstimmt
2. Laden Sie die App erneut hoch und installieren Sie sie im Team/Chat neu
3. Prüfen Sie, ob Ihr Organisationsadministrator RSC-Berechtigungen blockiert hat
4. Bestätigen Sie, dass Sie den richtigen Scope verwenden: `ChannelMessage.Read.Group` für Teams, `ChatMessage.Read.Chat` für Gruppenchats

## Referenzen

- [Azure Bot erstellen](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Einrichtungsleitfaden für Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-Apps erstellen/verwalten
- [Teams-App-Manifestschema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanalnachrichten mit RSC empfangen](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referenz zu RSC-Berechtigungen](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams-Bot-Dateiverarbeitung](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (Kanal/Gruppe erfordert Graph)
- [Proaktives Messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams-CLI für Bot-Verwaltung

## Verwandt

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung
