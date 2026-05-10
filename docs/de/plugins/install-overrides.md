---
read_when:
    - Onboarding- oder Einrichtungsabläufe mit einem lokal gepackten Plugin testen
    - Überprüfen eines Plugin-Pakets vor der Veröffentlichung
    - Automatische Plugin-Installation durch ein Testartefakt ersetzen
sidebarTitle: Install overrides
summary: Paketierte Plugin-Overrides mit Installationsabläufen während der Einrichtung testen
title: Überschreibungen für Plugin-Installationen
x-i18n:
    generated_at: "2026-05-10T19:43:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin-Installations-Overrides ermöglichen Maintainern, Plugin-Installationen zur Einrichtungszeit mit
einem bestimmten npm-Paket oder einem lokalen `npm-pack`-Tarball zu testen. Sie sind nur für E2E- und Paketvalidierung
gedacht. Normale Benutzer sollten Plugins mit
[`openclaw plugins install`](/de/cli/plugins) installieren.

<Warning>
Overrides führen Plugin-Code aus der von Ihnen angegebenen Quelle aus. Verwenden Sie sie nur in einem
isolierten Zustandsverzeichnis oder auf einer entsorgbaren Testmaschine.
</Warning>

## Umgebung

Overrides sind deaktiviert, sofern nicht beide Variablen gesetzt sind:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Die Override-Map ist JSON, indiziert nach Plugin-ID. Werte unterstützen:

- `npm:<registry-spec>` für Registry-Pakete und exakte Versionen oder Tags
- `npm-pack:<path.tgz>` für lokale Tarballs, die von `npm pack` erzeugt wurden

Relative `npm-pack:`-Pfade werden vom aktuellen Arbeitsverzeichnis aus aufgelöst.

## Verhalten

Wenn ein Flow zur Einrichtungszeit die Installation eines Plugins anfordert, dessen ID in der Map enthalten ist,
verwendet OpenClaw die Override-Quelle anstelle der Katalog-, gebündelten oder standardmäßigen
npm-Quelle. Dies gilt für das Onboarding und andere Flows, die den gemeinsamen
Plugin-Installer zur Einrichtungszeit verwenden.

Overrides erzwingen weiterhin die erwartete Plugin-ID. Ein Tarball, der `codex`
zugeordnet ist, muss ein Plugin installieren, dessen Manifest-ID `codex` ist.

Overrides erben keinen offiziellen Status als vertrauenswürdige Quelle. Selbst wenn der Katalogeintrag
normalerweise ein OpenClaw-eigenes Paket darstellt, wird ein Override als
vom Operator bereitgestellte Testeingabe behandelt.

Workspace-`.env`-Dateien können Installations-Overrides nicht aktivieren. Setzen Sie diese Variablen in
der vertrauenswürdigen Shell, dem CI-Job oder dem Remote-Testbefehl, der OpenClaw startet.

## Paket-E2E

Verwenden Sie ein isoliertes Zustandsverzeichnis, damit Paketinstallationen und Installationsdatensätze
Ihren normalen OpenClaw-Zustand nicht berühren:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Überprüfen Sie das installierte Paket im Zustandsverzeichnis:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

Für Live-Provider-E2E laden Sie den echten API-Schlüssel aus einer vertrauenswürdigen Shell oder einem CI-Secret,
bevor Sie den Testbefehl starten. Geben Sie keine Schlüssel aus; melden Sie nur die Quelle und
ob der Schlüssel vorhanden war.
