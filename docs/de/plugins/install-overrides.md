---
read_when:
    - Testen von Onboarding- oder Einrichtungsabläufen mit einem lokal gepackten Plugin
    - Überprüfen eines Plugin-Pakets vor der Veröffentlichung
    - Ersetzen einer automatischen Plugin-Installation durch ein Testartefakt
sidebarTitle: Install overrides
summary: Paketierte Plugin-Überschreibungen mit Installationsabläufen während der Einrichtung testen
title: Überschreibungen für die Plugin-Installation
x-i18n:
    generated_at: "2026-07-24T04:32:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Überschreibungen für Plugin-Installationen ermöglichen es Maintainern, bei der Einrichtung erfolgende Plugin-Installationen auf
ein bestimmtes npm-Paket oder lokales npm-pack-Tarball statt auf die Katalog-,
gebündelte oder standardmäßige npm-Quelle zu verweisen. Sie sind ausschließlich für E2E und die Paketvalidierung
vorgesehen; normale Benutzer installieren Plugins mit
[`openclaw plugins install`](/de/cli/plugins).

<Warning>
Überschreibungen führen Plugin-Code aus der von Ihnen angegebenen Quelle aus. Verwenden Sie sie nur in einem
isolierten Zustandsverzeichnis oder auf einem temporären Testrechner.
</Warning>

## Umgebung

Überschreibungen sind deaktiviert, sofern nicht beide Variablen gesetzt sind:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Die Überschreibungszuordnung ist JSON, dessen Schlüssel die Plugin-ID ist. Die Werte unterstützen:

| Präfix                | Quelle                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | Registry-Pakete, exakte Versionen oder Tags                                                       |
| `npm-pack:<path.tgz>` | Lokale Tarballs, die von `npm pack` erzeugt wurden; relative Pfade werden vom aktuellen Arbeitsverzeichnis aus aufgelöst |

## Verhalten

Wenn ein Einrichtungsablauf ein Plugin installiert, dessen ID in der Zuordnung enthalten ist, verwendet OpenClaw
die Überschreibungsquelle statt der Katalog-, gebündelten oder standardmäßigen npm-
Quelle. Dies gilt für das Onboarding und jeden anderen Ablauf, der das gemeinsame
Installationsprogramm für Plugins während der Einrichtung verwendet.

- Überschreibungen erzwingen weiterhin die erwartete Plugin-ID: Ein `codex` zugeordnetes Tarball
  muss ein Plugin installieren, dessen Manifest-ID `codex` lautet.
- Überschreibungen übernehmen nicht den offiziellen Status als vertrauenswürdige Quelle. Selbst wenn der
  Katalogeintrag normalerweise ein OpenClaw-eigenes Paket darstellt, wird eine Überschreibung
  als vom Betreiber bereitgestellte Testeingabe behandelt.
- Workspace-`.env`-Dateien können Installationsüberschreibungen nicht aktivieren; beide Umgebungsvariablen stehen auf
  der Sperrliste für Workspace-dotenv. Setzen Sie sie in der vertrauenswürdigen Shell, im CI-Job oder
  im Remote-Testbefehl, der OpenClaw startet.

## Paket-E2E

Verwenden Sie ein isoliertes Zustandsverzeichnis, damit Paketinstallationen und Installationsdatensätze nicht
Ihren normalen OpenClaw-Zustand verändern:

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

Für Live-Provider-E2E laden Sie den echten API-Schlüssel aus einer vertrauenswürdigen Shell oder einem CI-
Secret, bevor Sie den Testbefehl starten. Geben Sie keine Schlüssel aus; melden Sie nur die
Quelle und ob der Schlüssel vorhanden war.
