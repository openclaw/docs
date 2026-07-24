---
read_when:
    - Sie stellen OpenClaw auf einer Cloud-VM mit Docker bereit
    - Sie benötigen den gemeinsamen Ablauf für die Erstellung des Binärabbilds, die Persistenz und die Aktualisierung
summary: Gemeinsame Schritte für die Docker-VM-Laufzeit für langlebige OpenClaw-Gateway-Hosts
title: Docker-VM-Laufzeit
x-i18n:
    generated_at: "2026-07-24T05:06:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Gemeinsame Laufzeitschritte für VM-basierte Docker-Installationen, beispielsweise bei GCP, Hetzner und ähnlichen VPS-Providern.

## Erforderliche Binärdateien in das Image integrieren

Binärdateien in einem laufenden Container zu installieren, ist eine Falle: Alles, was
zur Laufzeit installiert wird, geht bei einem Neustart verloren. Integrieren Sie jede externe Binärdatei, die ein Skill benötigt,
zur Build-Zeit in das Image.

Die folgenden Beispiele behandeln nur drei Binärdateien, alphabetisch sortiert:

- `gog` (aus `gogcli`) für den Gmail-Zugriff
- `goplaces` für Google Places
- `wacli` für WhatsApp

Dies sind Beispiele und keine vollständige Liste. Installieren Sie nach demselben Muster so viele Binärdateien, wie Ihre
Skills benötigen. Wenn Sie später einen Skill hinzufügen, der eine neue
Binärdatei benötigt:

1. Aktualisieren Sie das Dockerfile.
2. Erstellen Sie das Image neu.
3. Starten Sie die Container neu.

**Beispiel-Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Beispiel-Binärdatei 1: Gmail-CLI (gogcli — wird als `gog` installiert)
# Kopieren Sie die aktuelle URL des Linux-Artefakts von https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Beispiel-Binärdatei 2: Google-Places-CLI
# Kopieren Sie die aktuelle URL des Linux-Artefakts von https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Beispiel-Binärdatei 3: WhatsApp-CLI
# Kopieren Sie die aktuelle URL des Linux-Artefakts von https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Fügen Sie nach demselben Muster unten weitere Binärdateien hinzu

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
Die oben aufgeführten URLs sind Beispiele. Wählen Sie für ARM-basierte VMs die `arm64`-Artefakte. Verwenden Sie für reproduzierbare Builds versionierte Release-URLs.
</Note>

## Erstellen und starten

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Wenn der Build während `pnpm install --frozen-lockfile` mit `Killed` oder dem Exit-Code 137 fehlschlägt, verfügt die VM nicht über genügend Arbeitsspeicher. Verwenden Sie vor einem erneuten Versuch eine größere Maschinenklasse.

Binärdateien überprüfen:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Erwartete Ausgabe:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Überprüfen Sie, ob das Gateway ausgeführt wird:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Wenn `/healthz` eine 200-Antwort zurückgibt, bestätigt dies, dass der Gateway-Prozess Verbindungen entgegennimmt und fehlerfrei arbeitet; der integrierte Image-`HEALTHCHECK` fragt denselben Endpunkt ab.

## Was wo persistent gespeichert wird

OpenClaw wird in Docker ausgeführt, Docker ist jedoch nicht die maßgebliche Datenquelle. Der gesamte langlebige Zustand muss Neustarts, Neuerstellungen und Reboots überstehen.

| Komponente             | Speicherort                                            | Persistenzmechanismus          | Hinweise                                                                                                                   |
| ---------------------- | ------------------------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Gateway-Konfiguration  | `/home/node/.openclaw/`                                     | Host-Volume-Mount              | Enthält `openclaw.json`                                                                                                 |
| Kanal-/Provider-Zugangsdaten | `/home/node/.openclaw/credentials/`                                | Host-Volume-Mount              | Zugangsdatenmaterial für Kanäle und Provider                                                                                |
| Modellauthentifizierungsprofile | `/home/node/.openclaw/agents/`                              | Host-Volume-Mount              | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API-Schlüssel)                                                                                   |
| Alte OAuth-Schlüsseldatei | `/home/node/.config/openclaw/`                                  | Host-Volume-Mount              | Schreibgeschützte Kompatibilität für OAuth-Sidecars vor der Migration; `openclaw doctor --fix` migriert diese nach `auth-profiles.json` |
| Skill-Konfigurationen  | `/home/node/.openclaw/skills/`                                     | Host-Volume-Mount              | Zustand auf Skill-Ebene                                                                                                    |
| Agent-Arbeitsbereich   | `/home/node/.openclaw/workspace/`                                     | Host-Volume-Mount              | Code und Agent-Artefakte                                                                                                   |
| WhatsApp-Sitzung       | `/home/node/.openclaw/`                                     | Host-Volume-Mount              | Behält die QR-Anmeldung bei                                                                                                |
| Gmail-Schlüsselbund    | `/home/node/.openclaw/`                                     | Host-Volume + Passwort         | Erfordert `GOG_KEYRING_PASSWORD`                                                                                               |
| Plugin-Pakete          | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git`                 | Host-Volume-Mount              | Stammverzeichnisse herunterladbarer Plugin-Pakete                                                                          |
| Externe Binärdateien   | `/usr/local/bin/`                                     | Docker-Image                   | Müssen zur Build-Zeit integriert werden                                                                                    |
| Node-Laufzeit          | Container-Dateisystem                                  | Docker-Image                   | Wird bei jedem Image-Build neu erstellt                                                                                    |
| Betriebssystempakete   | Container-Dateisystem                                  | Docker-Image                   | Nicht zur Laufzeit installieren                                                                                            |
| Docker-Container       | Flüchtig                                                | Neustartbar                    | Kann gefahrlos gelöscht werden                                                                                             |

## Aktualisierungen

So aktualisieren Sie OpenClaw auf der VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Verwandte Themen

- [Docker](/de/install/docker)
- [Podman](/de/install/podman)
- [ClawDock](/de/install/clawdock)
