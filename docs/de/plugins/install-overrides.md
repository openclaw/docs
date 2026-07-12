---
read_when:
    - Testen von Onboarding- oder Einrichtungsabläufen mit einem lokal gepackten Plugin
    - Überprüfen eines Plugin-Pakets vor der Veröffentlichung
    - Ersetzen einer automatischen Plugin-Installation durch ein Testartefakt
sidebarTitle: Install overrides
summary: Überschreibungen paketierter Plugins mit Installationsabläufen während der Einrichtung testen
title: Überschreibungen für die Plugin-Installation
x-i18n:
    generated_at: "2026-07-12T01:54:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Überschreibungen für Plugin-Installationen ermöglichen es Maintainern, Plugin-Installationen während der Einrichtung auf ein bestimmtes npm-Paket oder ein lokales, mit `npm pack` erstelltes Tarball zu verweisen, statt die Katalogquelle, die gebündelte Quelle oder die standardmäßige npm-Quelle zu verwenden. Sie sind ausschließlich für E2E- und Paketvalidierungen vorgesehen; reguläre Benutzer installieren Plugins mit
[`openclaw plugins install`](/de/cli/plugins).

<Warning>
Überschreibungen führen Plugin-Code aus der von Ihnen angegebenen Quelle aus. Verwenden Sie sie nur mit einem isolierten Zustandsverzeichnis oder auf einem temporären Testsystem.
</Warning>

## Umgebung

Überschreibungen sind deaktiviert, sofern nicht beide Variablen festgelegt sind:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Die Überschreibungszuordnung ist ein JSON-Objekt, dessen Schlüssel Plugin-IDs sind. Die Werte unterstützen:

| Präfix                | Quelle                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | Registry-Pakete, exakte Versionen oder Tags                                                       |
| `npm-pack:<path.tgz>` | Lokale, mit `npm pack` erstellte Tarballs; relative Pfade werden vom aktuellen Arbeitsverzeichnis aus aufgelöst |

## Verhalten

Wenn ein Einrichtungsablauf ein Plugin installiert, dessen ID in der Zuordnung enthalten ist, verwendet OpenClaw die Überschreibungsquelle anstelle der Katalogquelle, der gebündelten Quelle oder der standardmäßigen npm-Quelle. Dies gilt für das Onboarding und alle anderen Abläufe, die das gemeinsam genutzte Installationsprogramm für Plugins während der Einrichtung verwenden.

- Überschreibungen erzwingen weiterhin die erwartete Plugin-ID: Ein `codex` zugeordnetes Tarball muss ein Plugin installieren, dessen Manifest-ID `codex` lautet.
- Überschreibungen übernehmen nicht den offiziellen Status als vertrauenswürdige Quelle. Selbst wenn der Katalogeintrag normalerweise ein OpenClaw-eigenes Paket darstellt, wird eine Überschreibung als vom Betreiber bereitgestellte Testeingabe behandelt.
- `.env`-Dateien im Workspace können Installationsüberschreibungen nicht aktivieren; beide Umgebungsvariablen stehen auf der Sperrliste für Workspace-Dotenv-Dateien. Legen Sie sie in der vertrauenswürdigen Shell, im CI-Job oder im Remote-Testbefehl fest, mit dem OpenClaw gestartet wird.

## Paket-E2E

Verwenden Sie ein isoliertes Zustandsverzeichnis, damit Paketinstallationen und Installationsdatensätze Ihren normalen OpenClaw-Zustand nicht verändern:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Überprüfen Sie das installierte Paket im Zustandsverzeichnis:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Beziehen Sie für Live-Provider-E2E den echten API-Schlüssel aus einer vertrauenswürdigen Shell oder einem CI-Secret, bevor Sie den Testbefehl starten. Geben Sie keine Schlüssel aus; melden Sie nur die Quelle und ob der Schlüssel vorhanden war.
